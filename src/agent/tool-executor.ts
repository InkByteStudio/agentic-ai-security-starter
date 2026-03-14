import { ToolName, toolRegistry } from "../security/tool-registry";
import { assertAllowedHost } from "../security/network-policy";

export async function executeTool(toolName: ToolName, args: unknown): Promise<unknown> {
  const toolDef = toolRegistry[toolName] as { outboundHost?: string };
  if (toolDef.outboundHost) {
    assertAllowedHost(toolDef.outboundHost);
  }

  const typedArgs = args as Record<string, unknown>;

  switch (toolName) {
    case "searchKnowledgeBase":
      return { articles: ["Refund policy", "Plan change workflow"] };

    case "getCustomerProfile":
      return {
        customerId: typedArgs.customerId,
        plan: "basic",
        billingStatus: "current",
      };

    case "updateCustomerPlan":
      return { success: true, changed: true };

    case "sendTransactionalEmail":
      return { success: true, queued: true };

    case "issueRefund":
      return { success: true, refundId: "rf_12345" };

    default:
      throw new Error(`Tool not implemented: ${toolName}`);
  }
}
