import { ToolRequest } from "../security/tool-registry";

export type ProposedPlan = {
  assistantMessage: string;
  toolRequests: ToolRequest[];
};

export interface ModelGateway {
  generatePlan(prompt: string): Promise<ProposedPlan>;
}
