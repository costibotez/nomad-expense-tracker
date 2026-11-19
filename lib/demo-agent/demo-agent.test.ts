import { describe, expect, it } from "vitest";
import { leadSource, scoreLead, type Qualification } from "@/lib/demo-agent/qualify";
import { buildLeadSummary, escapeHtml } from "@/lib/demo-agent/lead-summary";
import { checkDemoAgentRequest, clientIpKey, DemoAgentLimiter, MAX_MESSAGES } from "@/lib/demo-agent/limits";
import { speakableText, speechChunks } from "@/components/use-speech";

describe("scoreLead", () => {
  it("rates a long multi-country trip that is under way as hot, and offers the deploy card", () => {
    const r = scoreLead({
      tripLength: "six_months_plus",
      countries: 9,
      currencies: 9,
      currentTool: "spreadsheet",
      techComfort: "willing",
      timeline: "travelling_now",
    });
    expect(r.tier).toBe("hot");
    expect(r.fit).toBe("expenses");
    expect(r.nextStep).toBe("offer_deploy");
    expect(r.offerPro).toBe(false);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.missing).toEqual(["wealthAssets"]);
  });

  it("offers email instead of deploy to a hot lead who needs help setting up", () => {
    const r = scoreLead({
      tripLength: "ongoing_nomad",
      countries: 5,
      currencies: 4,
      currentTool: "trail_wallet",
      techComfort: "needs_help",
      timeline: "within_month",
    });
    expect(r.tier).toBe("hot");
    expect(r.nextStep).toBe("offer_email");
  });

  it("flags NomadWealth Pro only for visitors who also hold investments or property", () => {
    const base: Qualification = { tripLength: "three_to_six_months", countries: 3 };
    expect(scoreLead({ ...base, wealthAssets: ["real_estate", "stocks_etfs"] }).offerPro).toBe(true);
    expect(scoreLead({ ...base, wealthAssets: ["real_estate"] }).fit).toBe("expenses_and_pro");
    expect(scoreLead({ ...base, wealthAssets: ["none"] }).offerPro).toBe(false);
    expect(scoreLead(base).offerPro).toBe(false);
    expect(scoreLead({ ...base, wealthAssets: ["crypto"], timeline: "just_browsing" }).offerPro).toBe(false);
  });

  it("offers email to a warm lead once most facts are known", () => {
    const r = scoreLead({ tripLength: "one_to_three_months", countries: 2, currencies: 2, currentTool: "splitwise", timeline: "later" });
    expect(r.tier).toBe("warm");
    expect(r.missing.length).toBeLessThanOrEqual(3);
    expect(r.nextStep).toBe("offer_email");
  });

  it("keeps exploring with an unknown, browsing visitor", () => {
    const r = scoreLead({ timeline: "just_browsing" });
    expect(r.score).toBe(0);
    expect(r.tier).toBe("cold");
    expect(r.fit).toBe("undecided");
    expect(r.nextStep).toBe("keep_exploring");
    expect(r.missing[0]).toBe("tripLength");
  });

  it("builds a compact lead tag that fits the mailing list source column", () => {
    const q: Qualification = { tripLength: "six_months_plus", wealthAssets: ["crypto"] };
    const tag = leadSource(scoreLead(q));
    expect(tag).toMatch(/^expenses-agent:pro:(hot|warm|cold):\d+$/);
    expect(tag.length).toBeLessThanOrEqual(80);
    expect(leadSource(scoreLead({}))).toBe("expenses-agent:na:cold:0");
  });
});

describe("checkDemoAgentRequest", () => {
  const user = (text: string) => ({ id: "1", role: "user", parts: [{ type: "text", text }] });

  it("accepts a normal conversation", () => {
    expect(checkDemoAgentRequest({ messages: [user("hi")] }).ok).toBe(true);
  });

  it("refuses forged system turns, non-text user parts and oversize input", () => {
    expect(checkDemoAgentRequest({ messages: [{ role: "system", parts: [] }] }).ok).toBe(false);
    expect(checkDemoAgentRequest({ messages: [null] }).ok).toBe(false);
    expect(checkDemoAgentRequest({ messages: [{ role: "user", parts: [{ type: "file" }] }] }).ok).toBe(false);
    expect(checkDemoAgentRequest({ messages: [user("x".repeat(1001))] }).ok).toBe(false);
    expect(checkDemoAgentRequest({ messages: Array.from({ length: MAX_MESSAGES + 1 }, () => user("a")) }).ok).toBe(false);
    expect(checkDemoAgentRequest(null).ok).toBe(false);
  });
});

describe("DemoAgentLimiter", () => {
  it("allows up to the limit per window, then asks the caller to wait", () => {
    const l = new DemoAgentLimiter(2, 60_000);
    expect(l.hit("ip:a", 0)).toBe(0);
    expect(l.hit("ip:a", 1_000)).toBe(0);
    expect(l.hit("ip:a", 2_000)).toBe(58);
    expect(l.hit("ip:b", 2_000)).toBe(0);
    expect(l.hit("ip:a", 61_000)).toBe(0);
  });

  it("bounds memory by sweeping keys", () => {
    const l = new DemoAgentLimiter(5, 1_000, 3);
    for (let i = 0; i < 10; i++) l.hit(`ip:${i}`, i);
    expect(l.size).toBeLessThanOrEqual(3);
  });

  it("keys requests by the first forwarded IP", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIpKey(req)).toBe("ip:1.2.3.4");
    expect(clientIpKey(new Request("https://x.test"))).toBe("ip:unknown");
  });
});

describe("buildLeadSummary", () => {
  it("summarises structured answers only, with unknowns marked", () => {
    const q: Qualification = { tripLength: "ongoing_nomad", currentTool: "trail_wallet", wealthAssets: ["real_estate"] };
    const s = buildLeadSummary("a@b.co", q, scoreLead(q));
    const rows = Object.fromEntries(s.rows);
    expect(rows.Email).toBe("a@b.co");
    expect(rows["Trip length"]).toBe("Ongoing, full-time nomad");
    expect(rows["Uses today"]).toBe("Trail Wallet");
    expect(rows["Also holds"]).toBe("Real estate");
    expect(rows.Timeline).toBe("Unknown");
    expect(s.subject).toMatch(/^Expenses demo lead: (hot|warm|cold) · Nomad Expenses \+ NomadWealth Pro · \d+\/100$/);
  });

  it("escapes HTML in values", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("speech text helpers", () => {
  it("strips markdown and links and reads euro amounts naturally", () => {
    expect(speakableText("Spent so far €4,210.")).toBe("Spent so far 4,210 euros.");
    expect(speakableText("**Free**, see https://x.y/z")).toBe("Free, see the link");
  });

  it("splits long text into sentence chunks under the limit", () => {
    const text = Array.from({ length: 10 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const chunks = speechChunks(text, 60);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(60);
    expect(chunks.join(" ")).toBe(text);
  });
});
