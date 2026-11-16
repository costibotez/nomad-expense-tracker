/**
 * Demo mode turns a deployment into the public live demo: no password, sample
 * data and no way to change anything. It is on only when DEMO_MODE is "1".
 * A personal install never sets it.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "1";

export const DEMO_NOTICE =
  "This is a live demo, so nothing is saved. Deploy your own copy to keep your expenses.";
