import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { executeAgentTurn } from "./agent/execute";
import { AuditLogger } from "./security/audit";
import type { ModelGateway, ProposedPlan } from "./agent/model-gateway";
import { InMemoryApprovalStore } from "./security/approvals";
import { parseUserContext, getEnvironment } from "./security/identity";

class MockModelGateway implements ModelGateway {
  async generatePlan(): Promise<ProposedPlan> {
    return {
      assistantMessage:
        "I can review the customer profile, but I will require approval before any refund or plan change.",
      toolRequests: [],
    };
  }
}

const app = express();
app.use(express.json());
app.use(pinoHttp());

app.use(
  "/api/agent",
  rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const auditLogger = new AuditLogger(process.env.DATABASE_URL);
const approvalStore = new InMemoryApprovalStore();

async function resolveApproval(
  req: express.Request,
  res: express.Response,
  newStatus: "approved" | "denied",
): Promise<void> {
  const user = parseUserContext(req);
  if (!user) {
    res.status(401).json({ status: "error", message: "Missing or invalid identity headers" });
    return;
  }

  const approvalId = String(req.params.id);
  const record = await approvalStore.get(approvalId);
  if (!record) {
    res.status(404).json({ status: "error", message: "Approval not found" });
    return;
  }
  if (record.status !== "pending") {
    res.status(409).json({ status: "error", message: `Approval already ${record.status}` });
    return;
  }
  if (newStatus === "approved" && record.requestedByUserId === user.userId) {
    res.status(403).json({ status: "error", message: "Cannot approve your own request" });
    return;
  }

  await approvalStore.update(approvalId, { status: newStatus, approvedByUserId: user.userId });
  res.json({ ...(await approvalStore.get(approvalId)) });
}

app.post("/api/agent/execute", async (req, res) => {
  const user = parseUserContext(req);
  if (!user) {
    res.status(401).json({
      status: "error",
      message: "Missing or invalid x-user-id, x-user-role, or x-user-permissions headers.",
    });
    return;
  }

  try {
    const result = await executeAgentTurn({
      environment: getEnvironment(),
      user,
      sessionId: req.body.sessionId ?? crypto.randomUUID(),
      userMessage: req.body.message ?? "",
      memory: {},
      retrievedText: req.body.retrievedText,
      modelGateway: new MockModelGateway(),
      auditLogger,
      approvalStore,
    });

    res.json(result);
  } catch (error) {
    req.log.error({ error }, "agent execution failed");

    res.status(500).json({
      status: "error",
      message: "The agent could not complete this request safely. No action was taken.",
    });
  }
});

app.get("/api/approvals/:id", async (req, res) => {
  const record = await approvalStore.get(String(req.params.id));
  if (!record) {
    res.status(404).json({ status: "error", message: "Approval not found" });
    return;
  }
  res.json(record);
});

app.post("/api/approvals/:id/approve", (req, res) => resolveApproval(req, res, "approved"));
app.post("/api/approvals/:id/deny", (req, res) => resolveApproval(req, res, "denied"));

const PORT = parseInt(process.env.PORT ?? "3000", 10);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Secure agent app listening on http://localhost:${PORT}`);
  });
}

export { app, parseUserContext, getEnvironment };
