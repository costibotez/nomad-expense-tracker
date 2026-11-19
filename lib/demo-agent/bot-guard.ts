/**
 * Vercel BotID check for the demo guide endpoints. The shell layout mounts
 * <BotIdClient> for the same paths (DEMO_AGENT_PROTECTED_ROUTES), which tags
 * the panel's requests with a challenge token this verifies.
 *
 * In `next dev` BotID always reports a human. If the check itself fails (an
 * outage, or running off Vercel) it fails OPEN: the per-IP limiter, size caps
 * and the AI Gateway spend limit still apply, and a demo guide should not go
 * dark because a bot check could not be reached.
 */
import "server-only";
import { checkBotId } from "botid/server";

export async function rejectBots(): Promise<Response | null> {
  try {
    const verdict = await checkBotId();
    if (verdict.isBot) return Response.json({ error: "Access denied." }, { status: 403 });
  } catch {
    /* fail open, see above */
  }
  return null;
}
