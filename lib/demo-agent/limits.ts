/**
 * Request limits for /api/demo-agent. Pure and DB-free so they are unit-tested
 * and the guide needs no extra store.
 */

/** Conversation length (user + assistant messages) after which the guide stops. */
export const MAX_MESSAGES = 40;
/** Longest text a visitor may send in one message. */
export const MAX_USER_TEXT = 1_000;
/** Upper bound on the whole request body, tool outputs included. */
export const MAX_BODY_CHARS = 200_000;

export type CheckResult = { ok: true; messages: unknown[] } | { ok: false; status: number; error: string };

const INVALID = { ok: false, status: 400, error: "Invalid request." } as const;

export function checkDemoAgentRequest(body: unknown): CheckResult {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return INVALID;
  if (messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      status: 413,
      error: "This chat has reached its length limit. Start a new one to keep going.",
    };
  }
  if (JSON.stringify(messages).length > MAX_BODY_CHARS) {
    return { ok: false, status: 413, error: "Request too large." };
  }
  for (const m of messages) {
    const msg = m as { role?: unknown; parts?: unknown } | null;
    // Only the visitor and the guide speak: a forged "system" turn is refused.
    if (msg?.role !== "user" && msg?.role !== "assistant") return INVALID;
    if (!Array.isArray(msg.parts)) return INVALID;
    if (msg.role === "user") {
      for (const p of msg.parts as ({ type?: unknown; text?: unknown } | null)[]) {
        if (p?.type !== "text") return { ok: false, status: 400, error: "Only text messages are supported." };
        if (typeof p.text !== "string" || p.text.length > MAX_USER_TEXT) {
          return { ok: false, status: 413, error: `Keep messages under ${MAX_USER_TEXT} characters.` };
        }
      }
    }
  }
  return { ok: true, messages };
}

/** Rate-limit key for a request: the first X-Forwarded-For hop (set by Vercel), else a shared bucket. */
export function clientIpKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || req.headers.get("x-real-ip") || "unknown"}`;
}

/**
 * Sliding-window limiter, per server instance. Fluid Compute reuses instances,
 * so this catches a single client hammering the endpoint; it is not a global
 * guarantee (the AI Gateway spend limit is). Memory is bounded by sweeping.
 */
export class DemoAgentLimiter {
  private hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(limit = 20, windowMs = 10 * 60_000, maxKeys = 5_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  /** Record a request; returns seconds to wait (0 = allowed). */
  hit(key: string, now: number): number {
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return Math.max(1, Math.ceil((recent[0] + this.windowMs - now) / 1000));
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.sweep(since);
    return 0;
  }

  /** Number of keys held, for tests. */
  get size(): number {
    return this.hits.size;
  }

  private sweep(since: number): void {
    for (const [k, ts] of this.hits) {
      if (ts[ts.length - 1] <= since) this.hits.delete(k);
    }
    // Still too many live keys: drop the oldest-inserted ones.
    for (const k of this.hits.keys()) {
      if (this.hits.size <= this.maxKeys) break;
      this.hits.delete(k);
    }
  }
}
