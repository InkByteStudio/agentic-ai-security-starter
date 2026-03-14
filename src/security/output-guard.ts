import { redactSecrets } from "./context";

const PII_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: "[SSN_REDACTED]" },
];

export function sanitizeOutput(text: string): string {
  let result = redactSecrets(text);
  for (const { pattern, label } of PII_PATTERNS) {
    result = result.replace(pattern, label);
  }
  return result;
}

export function sanitizeToolResult(result: unknown): unknown {
  if (typeof result === "string") {
    return sanitizeOutput(result);
  }
  if (result !== null && typeof result === "object") {
    const serialized = JSON.stringify(result);
    const sanitized = sanitizeOutput(serialized);
    if (sanitized !== serialized) {
      return JSON.parse(sanitized);
    }
  }
  return result;
}
