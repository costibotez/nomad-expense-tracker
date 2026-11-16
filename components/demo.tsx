"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChartPie, Map, Plus, ReceiptText, RotateCcw } from "lucide-react";
import { Hero, Panel, TripCard } from "@/components/ui";
import { CATEGORIES, categoryOf } from "@/lib/constants";
import { CategoryIcon } from "@/lib/icons";

type Screen = "overview" | "expenses" | "add" | "trip";
type Expense = { id: number; category: string; note: string; amount: number; currency: string; eur: number; place: string };
const sample: Expense[] = [
  { id: 1, category: "accommodation", note: "Apartment", amount: 18000, currency: "THB", eur: 473.68, place: "Chiang Mai" },
  { id: 2, category: "food", note: "Dinner at the night market", amount: 320, currency: "THB", eur: 8.42, place: "Chiang Mai" },
  { id: 3, category: "activities", note: "Temple visit", amount: 200, currency: "THB", eur: 5.26, place: "Chiang Mai" },
  { id: 4, category: "transport", note: "Airport train", amount: 1500, currency: "JPY", eur: 9.38, place: "Tokyo" },
];
const rates: Record<string, number> = { EUR: 1, THB: 38, JPY: 160, USD: 1.1 };
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(value);
const tabs = [
  { id: "overview", label: "Overview", Icon: ChartPie },
  { id: "expenses", label: "Expenses", Icon: ReceiptText },
  { id: "add", label: "Add expense", Icon: Plus },
  { id: "trip", label: "Trip", Icon: Map },
] as const;

export function Demo() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [items, setItems] = useState(sample);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const total = items.reduce((sum, item) => sum + item.eur, 0);
  const categories = CATEGORIES.map((entry) => ({ ...entry, total: items.filter((item) => item.category === entry.id).reduce((sum, item) => sum + item.eur, 0) })).filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);

  function addExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setItems((current) => [{ id: Date.now(), category, note: note.trim() || categoryOf(category).label, amount: value, currency, eur: value / rates[currency], place: "Chiang Mai" }, ...current]);
    setAmount(""); setNote(""); setSaved(true); setScreen("expenses");
  }
  function reset() { setItems(sample); setAmount(""); setNote(""); setCategory("food"); setCurrency("THB"); setSaved(false); setScreen("overview"); }

  return <div className="demo-page">
    <div className="demo-banner"><Link href="/"><ArrowLeft size={15} /> Home</Link><span><strong>Interactive demo</strong> · Sample data only</span><button onClick={reset} type="button"><RotateCcw size={14} /> Reset</button></div>
    <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+120px)]">
      <p className="demo-notice">Explore freely. Changes stay in this browser tab and reset when you leave or reload.</p>
      {screen === "overview" && <div className="flex flex-col gap-5"><Hero title="Overview" subtitle="Your sample trip"><div className="mt-5"><TripCard label="Whole trip" name="Chiang Mai to Tokyo" mark="EUR" markCaption="All amounts in euro" /></div><p className="mt-4 font-semibold">Whole trip</p><p className="text-xs text-hero-muted">2 countries · sample itinerary</p></Hero>
        <div className="grid grid-cols-3 gap-3 text-center">{tabs.filter((tab) => tab.id !== "overview").map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setScreen(id)} className="flex flex-col items-center gap-2 text-xs text-muted"><span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-ink"><Icon size={20} /></span>{label}</button>)}</div>
        <section className="card p-5"><p className="text-xs text-muted">Spent so far</p><p className="tabular text-[32px] font-semibold tracking-tight">{money(total)}</p><p className="mt-2 text-xs text-muted">{items.length} sample expenses</p></section>
        <Panel id="demo-category" title="By category"><ul className="divide-y divide-line">{categories.map((entry) => <li key={entry.id} className="flex items-center gap-3 py-3 text-sm"><span className="flex size-9 items-center justify-center rounded-xl border border-line"><CategoryIcon id={entry.id} size={17} /></span><span className="flex-1">{entry.label}</span><strong>{money(entry.total)}</strong></li>)}</ul></Panel>
      </div>}
      {screen === "expenses" && <div className="flex flex-col gap-5"><Hero title="Expenses" subtitle="Your sample spending" /><div className="card p-5"><p className="text-xs text-muted">Total spent</p><p className="tabular text-[32px] font-semibold">{money(total)}</p></div>{saved && <p role="status" className="card px-5 py-3 text-sm">Expense added to your demo.</p>}<section><h2 className="mb-2 px-1 text-sm text-muted">Sample expenses</h2><ul className="card divide-y divide-line">{items.map((item) => <li key={item.id} className="flex items-center gap-3 px-4 py-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line"><CategoryIcon id={item.category} size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.note}</strong><span className="text-xs text-muted">{categoryOf(item.category).label} · {item.place}</span></span><span className="text-right text-sm font-semibold">{item.amount.toLocaleString("en-GB")} {item.currency}<span className="block text-xs font-normal text-muted">{money(item.eur)}</span></span></li>)}</ul></section></div>}
      {screen === "add" && <div className="flex flex-col gap-5"><Hero title="Add expense" subtitle="Try adding a sample expense" /><form className="card flex flex-col gap-5 p-5" onSubmit={addExpense}><label className="flex flex-col gap-2 text-sm font-medium">Amount<input className="field" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label><label className="flex flex-col gap-2 text-sm font-medium">Currency<select className="field" value={currency} onChange={(event) => setCurrency(event.target.value)}>{Object.keys(rates).map((code) => <option key={code}>{code}</option>)}</select></label><label className="flex flex-col gap-2 text-sm font-medium">Category<select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label className="flex flex-col gap-2 text-sm font-medium">Note <span className="text-xs font-normal text-muted">Optional</span><input className="field" maxLength={100} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What was it for?" /></label><p className="text-xs leading-relaxed text-muted">Demo conversion uses fixed example rates, not live exchange rates.</p><button type="submit" className="min-h-12 rounded-full bg-accent font-semibold text-accent-ink">Add to demo</button></form></div>}
      {screen === "trip" && <div className="flex flex-col gap-5"><Hero title="Trip" subtitle="A sample itinerary"><div className="mt-5"><TripCard label="🇹🇭 Thailand" name="Chiang Mai" mark="THB" markCaption="Thai baht" /></div></Hero><Panel id="demo-itinerary" title="Itinerary"><ul className="divide-y divide-line"><li className="flex gap-3 py-4"><span className="text-2xl">🇹🇭</span><span><strong className="block text-sm">Chiang Mai, Thailand</strong><span className="text-xs text-muted">Thai baht · First stop</span></span></li><li className="flex gap-3 py-4"><span className="text-2xl">🇯🇵</span><span><strong className="block text-sm">Tokyo, Japan</strong><span className="text-xs text-muted">Japanese yen · Next stop</span></span></li></ul></Panel><p className="text-sm text-muted">In your own tracker you can add and edit trip legs, export expenses and create read-only share links.</p></div>}
    </main>
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+14px)] z-10 flex justify-center" aria-label="Demo navigation"><ul className="flex items-center gap-2 rounded-full bg-pill p-1.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)]" style={{ border: "1px solid var(--pill-line)" }}>{tabs.map(({ id, label, Icon }) => <li key={id}><button type="button" aria-label={label} aria-current={screen === id ? "page" : undefined} onClick={() => setScreen(id)} className={`flex size-[52px] items-center justify-center rounded-full ${screen === id ? "bg-white text-[#0a0a0a]" : "text-white/70"}`}><Icon size={22} aria-hidden /></button></li>)}</ul></nav>
  </div>;
}
