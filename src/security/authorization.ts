import { toolRegistry, ToolRequest, ToolName, Environment } from "./tool-registry";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type UserContext = {
  userId: string;
  role: "viewer" | "support" | "billing-admin";
  permissions: string[];
};

export type PolicyDecision =
  | { decision: "allow"; risk: RiskLevel; reason: string; parsedArgs: unknown }
  | { decision: "require-approval"; risk: RiskLevel; reason: string }
  | { decision: "deny"; risk: RiskLevel; reason: string };

function baseRisk(toolName: ToolName): RiskLevel {
  const tool = toolRegistry[toolName];

  if (tool.humanImpacting && tool.mode === "write") return "critical";
  if (tool.mode === "write") return "high";
  if (tool.humanImpacting) return "high";
  return "low";
}

export function authorizeToolCall(args: {
  environment: Environment;
  user: UserContext;
  toolRequest: ToolRequest;
}): PolicyDecision {
  const toolName = args.toolRequest.toolName;
  const tool = toolRegistry[toolName];
  if (!tool) {
    return {
      decision: "deny",
      risk: "critical",
      reason: `Unknown tool: ${args.toolRequest.toolName}`,
    };
  }

  const parsed = tool.argsSchema.safeParse(args.toolRequest.args);
  if (!parsed.success) {
    return {
      decision: "deny",
      risk: "high",
      reason: `Invalid arguments for ${tool.name}`,
    };
  }

  if (!tool.allowedEnvironments.includes(args.environment)) {
    return {
      decision: "deny",
      risk: baseRisk(toolName),
      reason: `${tool.name} is not allowed in ${args.environment}`,
    };
  }

  if (!args.user.permissions.includes(tool.requiredPermission)) {
    return {
      decision: "deny",
      risk: baseRisk(toolName),
      reason: `Missing permission: ${tool.requiredPermission}`,
    };
  }

  if (tool.mode === "write" && args.environment === "production" && !args.toolRequest.userConfirmed) {
    return {
      decision: "require-approval",
      risk: baseRisk(toolName),
      reason: `Write tool ${tool.name} requires explicit confirmation in production`,
    };
  }

  if (tool.requiresConfirmation && !args.toolRequest.userConfirmed && !args.toolRequest.approvalId) {
    return {
      decision: "require-approval",
      risk: baseRisk(toolName),
      reason: `${tool.name} requires user confirmation or an approval record`,
    };
  }

  return {
    decision: "allow",
    risk: baseRisk(toolName),
    reason: `${tool.name} allowed for ${args.user.role}`,
    parsedArgs: parsed.data,
  };
}
