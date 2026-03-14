import crypto from "node:crypto";
import { ModelGateway } from "./model-gateway";
import { executeTool } from "./tool-executor";
import { createPromptEnvelope } from "../security/context-builder";
import { authorizeToolCall, UserContext } from "../security/authorization";
import { classifyUserIntent } from "../security/risk";
import { AuditLogger } from "../security/audit";
import type { Environment } from "../security/tool-registry";

export type ExecuteArgs = {
  environment: Environment;
  user: UserContext;
  sessionId: string;
  userMessage: string;
  memory: Record<string, string>;
  retrievedText?: string;
  modelGateway: ModelGateway;
  auditLogger: AuditLogger;
};

export async function executeAgentTurn(args: ExecuteArgs) {
  const requestId = crypto.randomUUID();
  const intentRisk = classifyUserIntent(args.userMessage);

  await args.auditLogger.log({
    requestId,
    sessionId: args.sessionId,
    userId: args.user.userId,
    eventType: "user_request",
    riskLevel: intentRisk,
    details: {
      userMessagePreview: args.userMessage.slice(0, 200),
    },
  });

  if (intentRisk === "critical") {
    await args.auditLogger.log({
      requestId,
      sessionId: args.sessionId,
      userId: args.user.userId,
      eventType: "request_blocked",
      riskLevel: "critical",
      details: {
        reason: "Intent classifier blocked the request",
      },
    });

    return {
      status: "blocked",
      message: "This request requires manual review before the agent can continue.",
    };
  }

  const prompt = createPromptEnvelope({
    userMessage: args.userMessage,
    retrievedText: args.retrievedText,
    memory: args.memory,
  });

  const plan = await args.modelGateway.generatePlan(prompt);

  await args.auditLogger.log({
    requestId,
    sessionId: args.sessionId,
    userId: args.user.userId,
    eventType: "model_plan",
    riskLevel: "medium",
    details: {
      assistantMessagePreview: plan.assistantMessage.slice(0, 300),
      proposedTools: plan.toolRequests.map((t) => t.toolName),
    },
  });

  const toolResults: Array<{ toolName: string; result: unknown }> = [];

  for (const toolRequest of plan.toolRequests) {
    const decision = authorizeToolCall({
      environment: args.environment,
      user: args.user,
      toolRequest,
    });

    await args.auditLogger.log({
      requestId,
      sessionId: args.sessionId,
      userId: args.user.userId,
      eventType: "policy_decision",
      riskLevel: decision.risk,
      details: {
        toolName: toolRequest.toolName,
        decision: decision.decision,
        reason: decision.reason,
      },
    });

    if (decision.decision === "deny") {
      return {
        status: "denied",
        message: `Tool denied: ${toolRequest.toolName}`,
        reason: decision.reason,
      };
    }

    if (decision.decision === "require-approval") {
      return {
        status: "approval-required",
        message: `Approval required before running ${toolRequest.toolName}`,
        reason: decision.reason,
      };
    }

    const result = await executeTool(toolRequest);

    toolResults.push({
      toolName: toolRequest.toolName,
      result,
    });

    await args.auditLogger.log({
      requestId,
      sessionId: args.sessionId,
      userId: args.user.userId,
      eventType: "tool_executed",
      riskLevel: decision.risk,
      details: {
        toolName: toolRequest.toolName,
        resultSummary: JSON.stringify(result).slice(0, 300),
      },
    });
  }

  return {
    status: "completed",
    assistantMessage: plan.assistantMessage,
    toolResults,
  };
}
