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
    | "tool_executed"
    | "approval_created"
    | "output_redacted";
  riskLevel: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
};

interface PgPool {
  query(text: string, values?: unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

export class AuditLogger {
  private logger = pino({ level: "info" });
  private pgPool: PgPool | null = null;

  constructor(databaseUrl?: string) {
    if (databaseUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Pool } = require("pg");
        this.pgPool = new Pool({ connectionString: databaseUrl }) as PgPool;
      } catch {
        this.logger.warn("pg not installed; skipping database audit persistence");
      }
    }
  }

  async log(event: AuditEvent): Promise<void> {
    const timestamp = new Date().toISOString();
    this.logger.info({ timestamp, ...event });

    if (this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO agent_audit_log
            (request_id, session_id, user_id, event_type, risk_level, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            event.requestId,
            event.sessionId,
            event.userId,
            event.eventType,
            event.riskLevel,
            JSON.stringify(event.details),
            timestamp,
          ]
        );
      } catch (err) {
        this.logger.error({ err }, "Failed to persist audit event to database");
      }
    }
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }
}
