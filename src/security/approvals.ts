export type ApprovalRecord = {
  approvalId: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  toolName: string;
  requestHash: string;
  status: "pending" | "approved" | "denied";
};
