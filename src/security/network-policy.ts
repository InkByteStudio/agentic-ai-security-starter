const ALLOWED_HOSTS = new Set([
  "api.internal.example",
  "billing.internal.example",
  "kb.internal.example",
]);

export function assertAllowedHost(urlString: string): void {
  const url = new URL(urlString);

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Outbound access denied for host: ${url.hostname}`);
  }
}
