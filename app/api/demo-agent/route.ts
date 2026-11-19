/**
 * POST /api/demo-agent: streams the live demo guide's replies (lib/demo-agent).
 *
 * LIVE DEMO ONLY: 404 unless DEMO_MODE=1 and NEXT_PUBLIC_DEMO_AGENT=1, so a
 * personal install never exposes a sales bot or calls a model. In demo mode
 * proxy.ts lets every /api route through without a password.
 *
 * Privacy: conversations are not stored or logged here. They go to the model
 * through Vercel AI Gateway and live only in the visitor's tab.
 *
 * Abuse limits, without a store: a per-instance sliding window per IP, a cap
 * on conversation length and message size, user/assistant roles only, and a
 * step and token cap in the agent. Set a spend limit on the AI Gateway as the
 * hard backstop.
 */
import { createAgentUIStreamResponse } from "ai";
import { DEMO_AGENT } from "@/lib/demo";
import { demoAgent } from "@/lib/demo-agent/agent";
import { rejectBots } from "@/lib/demo-agent/bot-guard";
import { checkDemoAgentRequest, clientIpKey, DemoAgentLimiter } from "@/lib/demo-agent/limits";

export const maxDuration = 60;

const limiter = new DemoAgentLimiter();

export async function POST(req: Request) {
  if (!DEMO_AGENT) return new Response("Not found", { status: 404 });

  const blocked = await rejectBots();
  if (blocked) return blocked;

  const retryAfter = limiter.hit(clientIpKey(req), Date.now());
  if (retryAfter > 0) {
    return Response.json(
      { error: "You're sending messages quickly. Give it a minute and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const checked = checkDemoAgentRequest(await req.json().catch(() => null));
  if (!checked.ok) return Response.json({ error: checked.error }, { status: checked.status });

  return createAgentUIStreamResponse({
    agent: demoAgent,
    uiMessages: checked.messages,
    abortSignal: req.signal,
    // Never echo provider errors (they can carry request details) to visitors.
    onError: () => "The guide hit a snag. Please try again in a moment.",
  });
}
