import crypto from "node:crypto";
import { ContextItem, buildModelContext, filterMemoryForModel } from "./context";
import { SYSTEM_POLICY } from "./policy-prompt";

export function createPromptEnvelope(args: {
  userMessage: string;
  retrievedText?: string;
  memory: Record<string, string>;
}): string {
  const items: ContextItem[] = [
    {
      id: crypto.randomUUID(),
      source: "user-input",
      trust: "untrusted",
      label: "latest_user_message",
      content: args.userMessage,
    },
  ];

  if (args.retrievedText) {
    items.push({
      id: crypto.randomUUID(),
      source: "retrieved-context",
      trust: "untrusted",
      label: "retrieved_context",
      content: args.retrievedText,
    });
  }

  items.push(...filterMemoryForModel(args.memory));

  return [
    "SYSTEM_POLICY",
    SYSTEM_POLICY,
    "",
    "CONTEXT",
    buildModelContext(items),
  ].join("\n");
}
