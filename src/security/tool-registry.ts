import { z } from "zod";

export type ToolMode = "read" | "write";
export type Environment = "development" | "staging" | "production";

export type ToolDefinition<TArgs = unknown> = {
  name: string;
  description: string;
  mode: ToolMode;
  requiredPermission: string;
  allowedEnvironments: Environment[];
  requiresConfirmation: boolean;
  humanImpacting: boolean;
  argsSchema: z.ZodType<TArgs>;
  outboundHost?: string;
};

const SearchKnowledgeBaseArgs = z.object({
  query: z.string().min(3).max(500),
});

const GetCustomerProfileArgs = z.object({
  customerId: z.string().uuid(),
});

const UpdateCustomerPlanArgs = z.object({
  customerId: z.string().uuid(),
  newPlan: z.enum(["basic", "pro", "enterprise"]),
  reason: z.string().min(5).max(500),
});

const SendTransactionalEmailArgs = z.object({
  customerId: z.string().uuid(),
  template: z.enum(["plan-change", "billing-notice"]),
  variables: z.record(z.string(), z.string().max(500)),
});

const IssueRefundArgs = z.object({
  customerId: z.string().uuid(),
  amountCents: z.number().int().positive().max(500000),
  reason: z.string().min(5).max(500),
});

export const toolRegistry: Record<string, ToolDefinition> & {
  searchKnowledgeBase: ToolDefinition;
  getCustomerProfile: ToolDefinition;
  updateCustomerPlan: ToolDefinition;
  sendTransactionalEmail: ToolDefinition;
  issueRefund: ToolDefinition;
} = {
  searchKnowledgeBase: {
    name: "searchKnowledgeBase",
    description: "Read-only search over internal help and policy content.",
    mode: "read",
    requiredPermission: "kb:read",
    allowedEnvironments: ["development", "staging", "production"],
    requiresConfirmation: false,
    humanImpacting: false,
    argsSchema: SearchKnowledgeBaseArgs,
    outboundHost: "https://kb.internal.example",
  },
  getCustomerProfile: {
    name: "getCustomerProfile",
    description: "Retrieve customer profile data needed for support tasks.",
    mode: "read",
    requiredPermission: "customer:read",
    allowedEnvironments: ["development", "staging", "production"],
    requiresConfirmation: false,
    humanImpacting: false,
    argsSchema: GetCustomerProfileArgs,
  },
  updateCustomerPlan: {
    name: "updateCustomerPlan",
    description: "Change a customer subscription plan.",
    mode: "write",
    requiredPermission: "customer:write",
    allowedEnvironments: ["staging", "production"],
    requiresConfirmation: true,
    humanImpacting: true,
    argsSchema: UpdateCustomerPlanArgs,
  },
  sendTransactionalEmail: {
    name: "sendTransactionalEmail",
    description: "Send a pre-approved customer email template.",
    mode: "write",
    requiredPermission: "email:send",
    allowedEnvironments: ["staging", "production"],
    requiresConfirmation: true,
    humanImpacting: true,
    argsSchema: SendTransactionalEmailArgs,
    outboundHost: "https://api.internal.example",
  },
  issueRefund: {
    name: "issueRefund",
    description: "Issue a billing refund to a customer.",
    mode: "write",
    requiredPermission: "refund:write",
    allowedEnvironments: ["staging", "production"],
    requiresConfirmation: true,
    humanImpacting: true,
    argsSchema: IssueRefundArgs,
    outboundHost: "https://billing.internal.example",
  },
};

export type ToolName = keyof typeof toolRegistry;

export type ToolRequest = {
  toolName: ToolName;
  args: unknown;
  userConfirmed?: boolean;
  approvalId?: string;
};
