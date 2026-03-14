import { toolRegistry } from "./tool-registry";

for (const tool of Object.values(toolRegistry)) {
  console.log({
    name: tool.name,
    mode: tool.mode,
    permission: tool.requiredPermission,
    humanImpacting: tool.humanImpacting,
    requiresConfirmation: tool.requiresConfirmation,
    environments: tool.allowedEnvironments.join(", "),
  });
}
