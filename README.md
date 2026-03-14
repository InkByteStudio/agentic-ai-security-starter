# agentic-ai-security-starter

Reference implementation for securing agentic AI apps with guardrails, per-tool permissions, approval gates, and structured audit logs.

This is a working TypeScript starter you can fork and adapt for your own agentic application. It demonstrates every security pattern from the companion tutorial: tool registries with Zod validation, trust boundary tagging, code-enforced authorization, human approval gates, intent risk classification, and structured audit logging.

## Architecture

```
User Request
     |
     v
  Express (rate limiting, logging)
     |
     v
  Risk Classifier ── block critical intent
     |
     v
  Context Builder ── tag trust boundaries, redact secrets
     |
     v
  Model Gateway ── get proposed plan
     |
     v
  Authorization ── per-tool permission check
     |
     v
  Approval Gate ── require confirmation for write/human-impacting
     |
     v
  Tool Executor ── execute allowed tools
     |
     v
  Audit Logger ── structured log of every decision
```

## What's Included

| File | Purpose |
|---|---|
| `src/security/tool-registry.ts` | Tool definitions with Zod schemas, permissions, environment restrictions |
| `src/security/context.ts` | Trust boundary tagging, secret redaction, untrusted content wrapping |
| `src/security/policy-prompt.ts` | System policy prompt (code-controlled, not model-controlled) |
| `src/security/context-builder.ts` | Prompt envelope builder with source and trust labels |
| `src/security/authorization.ts` | Per-tool authorization with risk classification |
| `src/security/approvals.ts` | Approval record types |
| `src/security/risk.ts` | Intent risk classifier for early detection |
| `src/security/network-policy.ts` | Outbound host allowlist |
| `src/security/audit.ts` | Structured audit logger (Pino) |
| `src/agent/model-gateway.ts` | Model gateway interface |
| `src/agent/tool-executor.ts` | Tool execution stubs (replace with your real integrations) |
| `src/agent/execute.ts` | Secure execution orchestrator |
| `src/server.ts` | Express server with rate limiting |
| `src/security/agent-security.spec.ts` | Vitest security tests |
| `db/migrations/001_create_agent_audit_log.sql` | PostgreSQL audit log schema |

## Quick Start

```bash
git clone https://github.com/InkByteStudio/agentic-ai-security-starter.git
cd agentic-ai-security-starter
npm install
cp .env.example .env
npm run dev
```

The server starts at `http://localhost:3000`. Send a test request:

```bash
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the refund policy?", "sessionId": "test-session"}'
```

Run the security tests:

```bash
npm test
```

Print the tool power inventory:

```bash
npm run inventory
```

## Adapt for Your Own Agent

1. **Replace tool stubs** in `src/agent/tool-executor.ts` with your real integrations (APIs, databases, MCP tools)
2. **Update the tool registry** in `src/security/tool-registry.ts` with your actual tools, permissions, and Zod schemas
3. **Swap the model gateway** in `src/agent/model-gateway.ts` to call your LLM provider
4. **Adjust the policy prompt** in `src/security/policy-prompt.ts` for your use case
5. **Update the network allowlist** in `src/security/network-policy.ts` with your real hosts
6. **Add the audit migration** from `db/migrations/` if you want persistent audit trails

## Related

- [Tutorial: How to Secure an Agentic AI App](https://igotasite4that.com/tutorials/secure-agentic-ai-app-guardrails-tool-permissions-audit-logs)
- [Blog: Agentic AI Security in 2026](https://igotasite4that.com/blog/agentic-ai-security-2026)

## License

MIT
