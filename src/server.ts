import express from "express";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { executeAgentTurn } from "./agent/execute";
import { AuditLogger } from "./security/audit";
import type { ModelGateway, ProposedPlan } from "./agent/model-gateway";

class MockModelGateway implements ModelGateway {
  async generatePlan(): Promise<ProposedPlan> {
    return {
      assistantMessage: "I can review the customer profile, but I will require approval before any refund or plan change.",
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

app.post("/api/agent/execute", async (req, res) => {
  try {
    const result = await executeAgentTurn({
      environment: "production",
      user: {
        userId: "user-123",
        role: "support",
        permissions: ["kb:read", "customer:read"],
      },
      sessionId: req.body.sessionId ?? "session-dev",
      userMessage: req.body.message ?? "",
      memory: {},
      retrievedText: req.body.retrievedText,
      modelGateway: new MockModelGateway(),
      auditLogger: new AuditLogger(),
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

app.listen(3000, () => {
  console.log("Secure agent app listening on http://localhost:3000");
});
