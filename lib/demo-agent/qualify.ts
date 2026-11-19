/**
 * Lead qualification for the demo guide. Pure, so it is unit-tested and the
 * model never decides the score, the fit or the next step on its own.
 *
 * The agent fills these fields as they come up in conversation. Nothing here
 * is a money amount, and nothing is stored unless the visitor submits their
 * email.
 */
import { z } from "zod";

export const TRIP_LENGTHS = ["under_month", "one_to_three_months", "three_to_six_months", "six_months_plus", "ongoing_nomad"] as const;

export const CURRENT_TOOLS = [
  "spreadsheet",
  "trail_wallet",
  "splitwise",
  "other_app", // TravelSpend, Tricount, a budgeting app…
  "notes_or_nothing",
  "other",
] as const;

export const TECH_COMFORT = ["comfortable", "willing", "needs_help"] as const;

export const TIMELINE = ["travelling_now", "within_month", "later", "just_browsing"] as const;

/** Other things they own: the NomadWealth (net-worth cockpit) signal. */
export const WEALTH_ASSETS = ["stocks_etfs", "crypto", "real_estate", "private_loans", "business", "none"] as const;

export const qualificationSchema = z.object({
  tripLength: z.enum(TRIP_LENGTHS).optional().describe("How long the trip (or life on the road) lasts."),
  countries: z.number().int().min(1).max(100).optional().describe("How many countries the trip covers."),
  currencies: z.number().int().min(1).max(50).optional().describe("How many currencies they pay in."),
  currentTool: z.enum(CURRENT_TOOLS).optional().describe("What they use today to track travel spending."),
  techComfort: z
    .enum(TECH_COMFORT)
    .optional()
    .describe(
      "Deploying their own copy to Vercel + Neon: comfortable (has done it), willing (will follow a one-click guide), needs_help.",
    ),
  timeline: z.enum(TIMELINE).optional().describe("When they need it: already travelling, leaving within a month, later, or just browsing."),
  wealthAssets: z
    .array(z.enum(WEALTH_ASSETS))
    .optional()
    .describe("Investments, property or loans they also hold or want to track. ['none'] if they said they have none."),
});

export type Qualification = z.infer<typeof qualificationSchema>;

/** expenses = the free app fits; expenses_and_pro = they also hold wealth NomadWealth Pro tracks. */
export type Fit = "expenses" | "expenses_and_pro" | "undecided";
export type Tier = "hot" | "warm" | "cold";

export interface QualificationResult {
  score: number;
  tier: Tier;
  fit: Fit;
  /** Facts still worth asking about, most useful first. */
  missing: (keyof Qualification)[];
  /** What the agent should steer toward next. */
  nextStep: "keep_exploring" | "offer_deploy" | "offer_email";
  /** True once NomadWealth Pro may be offered (they hold investments, property or loans). */
  offerPro: boolean;
}

const TRIP_POINTS: Record<(typeof TRIP_LENGTHS)[number], number> = {
  under_month: 2,
  one_to_three_months: 8,
  three_to_six_months: 14,
  six_months_plus: 20,
  ongoing_nomad: 20,
};

const TOOL_POINTS: Record<(typeof CURRENT_TOOLS)[number], number> = {
  spreadsheet: 10,
  trail_wallet: 8,
  splitwise: 8,
  other_app: 8,
  notes_or_nothing: 6,
  other: 4,
};

const ORDER: (keyof Qualification)[] = [
  "tripLength",
  "countries",
  "currentTool",
  "techComfort",
  "timeline",
  "currencies",
  "wealthAssets",
];

export function hasWealth(q: Qualification): boolean {
  return (q.wealthAssets ?? []).some((a) => a !== "none");
}

export function scoreLead(q: Qualification): QualificationResult {
  let score = 0;

  // A long, multi-country trip is where one euro total earns its keep.
  if (q.tripLength) score += TRIP_POINTS[q.tripLength];
  if (q.countries !== undefined) score += q.countries >= 3 ? 12 : q.countries === 2 ? 8 : 0;
  if (q.currencies !== undefined) score += q.currencies >= 3 ? 12 : q.currencies === 2 ? 8 : 0;
  if (q.currentTool) score += TOOL_POINTS[q.currentTool];

  if (q.techComfort === "comfortable") score += 10;
  else if (q.techComfort === "willing") score += 7;

  if (q.timeline === "travelling_now") score += 16;
  else if (q.timeline === "within_month") score += 12;
  else if (q.timeline === "later") score += 4;
  else if (q.timeline === "just_browsing") score -= 10;

  score = Math.max(0, Math.min(100, score));
  const tier: Tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "cold";

  const wealth = hasWealth(q);
  const knowsTrip = q.tripLength !== undefined || q.countries !== undefined;
  const fit: Fit = wealth ? "expenses_and_pro" : knowsTrip ? "expenses" : "undecided";

  const missing = ORDER.filter((k) => {
    const v = q[k];
    return v === undefined || (Array.isArray(v) && v.length === 0);
  });

  let nextStep: QualificationResult["nextStep"] = "keep_exploring";
  if (tier === "hot") nextStep = q.techComfort === "needs_help" ? "offer_email" : "offer_deploy";
  else if (tier === "warm" && missing.length <= 3) nextStep = "offer_email";

  // Pro is a sideline offer: only for someone who told us they hold wealth to
  // track, and not to a visitor who is just browsing.
  const offerPro = wealth && q.timeline !== "just_browsing";

  return { score, tier, fit, missing, nextStep, offerPro };
}

/**
 * Compact lead tag stored in the admin waitlist's `source` column (max 80
 * chars), e.g. `expenses-agent:pro:hot:72`. Lets the owner sort agent leads
 * without any change to the admin app's schema.
 */
export function leadSource(r: Pick<QualificationResult, "fit" | "tier" | "score">): string {
  const plan = r.fit === "expenses_and_pro" ? "pro" : r.fit === "expenses" ? "free" : "na";
  return `expenses-agent:${plan}:${r.tier}:${r.score}`.slice(0, 80);
}
