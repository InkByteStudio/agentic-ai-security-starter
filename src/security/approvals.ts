export type ApprovalRecord = {
  approvalId: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  toolName: string;
  toolArgs: unknown;
  requestHash: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

export interface ApprovalStore {
  create(record: ApprovalRecord): Promise<void>;
  get(approvalId: string): Promise<ApprovalRecord | null>;
  update(approvalId: string, patch: Partial<ApprovalRecord>): Promise<void>;
}

export class InMemoryApprovalStore implements ApprovalStore {
  private records = new Map<string, ApprovalRecord>();

  async create(record: ApprovalRecord): Promise<void> {
    this.records.set(record.approvalId, { ...record });
  }

  async get(approvalId: string): Promise<ApprovalRecord | null> {
    return this.records.get(approvalId) ?? null;
  }

  async update(approvalId: string, patch: Partial<ApprovalRecord>): Promise<void> {
    const existing = this.records.get(approvalId);
    if (!existing) throw new Error(`Approval not found: ${approvalId}`);
    this.records.set(approvalId, { ...existing, ...patch });
  }
}
