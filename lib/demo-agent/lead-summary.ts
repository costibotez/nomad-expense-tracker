/**
 * The owner's "new lead" email, built from the visitor's email and their
 * structured qualification answers only. The chat transcript is never
 * included: conversations are not stored, and visitors are told so.
 */
import type { Qualification, QualificationResult } from "@/lib/demo-agent/qualify";

const TRIP_LABELS: Record<string, string> = {
  under_month: "Under a month",
  one_to_three_months: "1 to 3 months",
  three_to_six_months: "3 to 6 months",
  six_months_plus: "6 months or more",
  ongoing_nomad: "Ongoing, full-time nomad",
};

const TOOL_LABELS: Record<string, string> = {
  spreadsheet: "Spreadsheet",
  trail_wallet: "Trail Wallet",
  splitwise: "Splitwise",
  other_app: "Another travel or budgeting app",
  notes_or_nothing: "Notes or nothing",
  other: "Other",
};

const COMFORT_LABELS: Record<string, string> = {
  comfortable: "Comfortable deploying to Vercel + Neon",
  willing: "Willing to follow the one-click setup",
  needs_help: "Wants help setting it up",
};

const TIMELINE_LABELS: Record<string, string> = {
  travelling_now: "Travelling now",
  within_month: "Leaving within a month",
  later: "Later",
  just_browsing: "Just browsing",
};

const ASSET_LABELS: Record<string, string> = {
  stocks_etfs: "Stocks / ETFs",
  crypto: "Crypto",
  real_estate: "Real estate",
  private_loans: "Private loans",
  business: "Business",
  none: "None",
};

export interface LeadSummary {
  subject: string;
  heading: string;
  /** [label, value] rows, plain text (the sender escapes them). */
  rows: [string, string][];
}

const FIT_LABELS = { expenses: "Nomad Expenses", expenses_and_pro: "Nomad Expenses + NomadWealth Pro", undecided: "Undecided" };

export function buildLeadSummary(
  email: string,
  q: Qualification,
  r: Pick<QualificationResult, "score" | "tier" | "fit">,
): LeadSummary {
  const unknown = "Unknown";
  const rows: [string, string][] = [
    ["Email", email],
    ["Fit", `${r.tier.toUpperCase()} · score ${r.score}/100`],
    ["Good match for", FIT_LABELS[r.fit]],
    ["Trip length", q.tripLength ? TRIP_LABELS[q.tripLength] : unknown],
    ["Countries", q.countries ? String(q.countries) : unknown],
    ["Currencies", q.currencies ? String(q.currencies) : unknown],
    ["Uses today", q.currentTool ? TOOL_LABELS[q.currentTool] : unknown],
    ["Setup", q.techComfort ? COMFORT_LABELS[q.techComfort] : unknown],
    ["Timeline", q.timeline ? TIMELINE_LABELS[q.timeline] : unknown],
    ["Also holds", q.wealthAssets?.length ? q.wealthAssets.map((a) => ASSET_LABELS[a] ?? a).join(", ") : unknown],
  ];
  return {
    subject: `Expenses demo lead: ${r.tier} · ${FIT_LABELS[r.fit]} · ${r.score}/100`,
    heading: "New lead from the Nomad Expenses demo guide",
    rows,
  };
}

/** Minimal HTML escaping for values placed in the email body. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
