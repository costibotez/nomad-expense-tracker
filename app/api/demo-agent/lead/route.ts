/**
 * POST /api/demo-agent/lead: emails the owner when a visitor leaves their
 * email in the demo guide. The chat panel calls it right after the visitor's
 * own mailing-list signup succeeds, so only someone who chose to share their
 * email triggers it.
 *
 * Carries the email and the structured qualification answers, never the
 * conversation. The score is recomputed here; the client's is not trusted.
 *
 * LIVE DEMO ONLY (same guard as /api/demo-agent). Needs RESEND_API_KEY,
 * DEMO_AGENT_FROM_EMAIL and DEMO_AGENT_LEAD_TO; without them it answers 204
 * and sends nothing.
 */
import { z } from "zod";
import { DEMO_AGENT } from "@/lib/demo";
import { rejectBots } from "@/lib/demo-agent/bot-guard";
import { buildLeadSummary, escapeHtml } from "@/lib/demo-agent/lead-summary";
import { clientIpKey, DemoAgentLimiter } from "@/lib/demo-agent/limits";
import { qualificationSchema, scoreLead } from "@/lib/demo-agent/qualify";

// A handful per IP per hour: a real visitor signs up once.
const limiter = new DemoAgentLimiter(3, 60 * 60_000);

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
  qualification: qualificationSchema.strict(),
});

export async function POST(req: Request) {
  if (!DEMO_AGENT) return new Response("Not found", { status: 404 });

  const blocked = await rejectBots();
  if (blocked) return blocked;
  if (limiter.hit(clientIpKey(req), Date.now()) > 0) return new Response(null, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEMO_AGENT_FROM_EMAIL;
  const to = process.env.DEMO_AGENT_LEAD_TO;
  if (!apiKey || !from || !to) return new Response(null, { status: 204 });

  const { email, qualification } = parsed.data;
  const summary = buildLeadSummary(email, qualification, scoreLead(qualification));
  const rowsHtml = summary.rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b6b69;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td>` +
        `<td style="padding:6px 0;font-size:14px;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: summary.subject,
      html:
        `<div style="font-family:system-ui,sans-serif;color:#0a0a0a;">` +
        `<h1 style="font-size:18px;margin:0 0 12px;">${escapeHtml(summary.heading)}</h1>` +
        `<p style="margin:0 0 12px;">A visitor left their email in the demo guide. Reply to this email to answer them directly.</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></div>`,
      text: `${summary.heading}\n\n${summary.rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`,
    }),
  }).catch(() => null);

  return new Response(null, { status: res?.ok ? 204 : 502 });
}
