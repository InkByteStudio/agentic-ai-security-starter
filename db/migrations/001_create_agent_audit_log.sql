CREATE TABLE IF NOT EXISTS agent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  tool_name TEXT NULL,
  approval_id TEXT NULL,
  details JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_request_id
  ON agent_audit_log (request_id);

CREATE INDEX IF NOT EXISTS idx_agent_audit_session_id
  ON agent_audit_log (session_id);

CREATE INDEX IF NOT EXISTS idx_agent_audit_event_type
  ON agent_audit_log (event_type);

CREATE INDEX IF NOT EXISTS idx_agent_audit_created_at
  ON agent_audit_log (created_at DESC);
