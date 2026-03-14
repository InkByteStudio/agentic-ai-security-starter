import type { Environment } from "./tool-registry";
import type { UserContext } from "./authorization";

export const VALID_ROLES: UserContext["role"][] = ["viewer", "support", "billing-admin"];

export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
}

export function parseUserContext(req: { headers: Record<string, unknown> }): UserContext | null {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  const permissions = req.headers["x-user-permissions"];

  if (typeof userId !== "string" || !userId) return null;
  if (typeof role !== "string" || !VALID_ROLES.includes(role as UserContext["role"])) return null;

  const permList =
    typeof permissions === "string" && permissions.length > 0
      ? permissions.split(",").map((p) => p.trim())
      : [];

  return { userId, role: role as UserContext["role"], permissions: permList };
}
