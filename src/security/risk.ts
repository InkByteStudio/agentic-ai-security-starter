export type IntentRisk = "low" | "medium" | "high" | "critical";

const HIGH_RISK_PATTERNS = [
  /ignore previous instructions/i,
  /bypass policy/i,
  /export all customer/i,
  /dump secrets/i,
  /delete all/i,
  /send to external address/i,
];

export function classifyUserIntent(userMessage: string): IntentRisk {
  const normalized = userMessage.trim();

  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "critical";
  }

  if (/refund|change plan|send email/i.test(normalized)) {
    return "high";
  }

  if (/customer|billing|account/i.test(normalized)) {
    return "medium";
  }

  return "low";
}
