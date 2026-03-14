import { ToolRequest } from "../security/tool-registry";

export async function executeTool(request: ToolRequest): Promise<unknown> {
  const args = request.args as Record<string, unknown>;

  switch (request.toolName) {
    case "searchKnowledgeBase":
      return { articles: ["Refund policy", "Plan change workflow"] };

    case "getCustomerProfile":
      return {
        customerId: args.customerId,
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
      throw new Error(`Tool not implemented: ${request.toolName}`);
  }
}
