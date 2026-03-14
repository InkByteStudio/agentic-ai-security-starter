import pino from "pino";

export type AuditEvent = {
  requestId: string;
  sessionId: string;
  userId: string;
  eventType:
    | "user_request"
    | "request_blocked"
    | "model_plan"
    | "policy_decision"
    | "tool_executed";
  riskLevel: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
};

export class AuditLogger {
  private logger = pino({ level: "info" });

  async log(event: AuditEvent): Promise<void> {
    this.logger.info({
      timestamp: new Date().toISOString(),
      ...event,
    });
  }
}
