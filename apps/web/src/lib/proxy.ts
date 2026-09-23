/** Client-side helper that talks to the same-origin authenticated proxy. */

export interface ProxyResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: { code: string; message: string; fields?: Record<string, string> } | null;
}

export async function proxy<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ProxyResult<T>> {
  const res = await fetch(`/api/proxy/${path.replace(/^\//, "")}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({ success: false, data: null, error: { code: "BAD_RESPONSE", message: "Invalid response" } }));
  return { ok: res.ok && json.success, status: res.status, data: json.data ?? null, error: json.error ?? null };
}
