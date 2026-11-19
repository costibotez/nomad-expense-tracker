/**
 * Demo mode turns a deployment into the public live demo: no password, sample
 * data and no way to change anything. It is on only when DEMO_MODE is "1".
 * A personal install never sets it.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "1";

export const DEMO_NOTICE =
  "This is a live demo, so nothing is saved. Deploy your own copy to keep your expenses.";

/**
 * The AI demo guide (lib/demo-agent): a chat panel on the live demo only. It
 * needs demo mode AND NEXT_PUBLIC_DEMO_AGENT=1, so a personal install never
 * shows a sales bot, calls a model or loads a third-party bot check.
 */
export const DEMO_AGENT = DEMO_MODE && process.env.NEXT_PUBLIC_DEMO_AGENT === "1";
