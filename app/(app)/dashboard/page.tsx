import { eq, isNull, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { BarList, ColumnChart, type ColumnItem } from "@/components/charts";
import { CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs } from "@/lib/db/schema";
import { daysBetween, formatEuro, formatMonth, formatShortDate } from "@/lib/format";
import { getLegs, NO_LEG, serverToday } from "@/lib/queries";

const total = sql<string>`coalesce(sum(${expenses.amountEur}), 0)`;
const count = sql<number>`count(*)::int`;
const month = sql<string>`to_char(${expenses.date}, 'YYYY-MM')`;

/** Days of a date range that have already happened, counting today. */
function elapsedDays(start: string, end: string, today: string) {
  if (today < start) return 0;
  return daysBetween(start, today < end ? today : end);
}

function nextMonth(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : "";
  const filter: SQL | undefined =
    country === NO_LEG ? isNull(expenses.legId) : country ? eq(legs.country, country) : undefined;

  const [allLegs, byLeg, byCategory, byMonth] = await Promise.all([
    getLegs(),
    db.select({ legId: expenses.legId, total, count }).from(expenses).groupBy(expenses.legId),
    db
      .select({ category: expenses.category, total })
      .from(expenses)
      .leftJoin(legs, eq(expenses.legId, legs.id))
      .where(filter)
      .groupBy(expenses.category),
    db
      .select({ month, total })
      .from(expenses)
      .leftJoin(legs, eq(expenses.legId, legs.id))
      .where(filter)
      .groupBy(month)
      .orderBy(month),
  ]);

  const today = serverToday();
  const legTotals = new Map(byLeg.map((r) => [r.legId, { total: Number(r.total), count: r.count }]));

  const legRows = allLegs.map((leg) => ({
    ...leg,
    total: legTotals.get(leg.id)?.total ?? 0,
    days: elapsedDays(leg.startDate, leg.endDate, today),
  }));
  const noLegTotal = legTotals.get(null)?.total ?? 0;

  const countryMap = new Map<string, { flag: string; total: number; days: number }>();
  for (const leg of legRows) {
    const entry = countryMap.get(leg.country) ?? { flag: leg.flag, total: 0, days: 0 };
    entry.total += leg.total;
    entry.days += leg.days;
    countryMap.set(leg.country, entry);
  }
  const countryNames = [...countryMap.keys()];

  const grandTotal = legRows.reduce((sum, l) => sum + l.total, 0) + noLegTotal;
  const grandCount = byLeg.reduce((sum, r) => sum + r.count, 0);
  const tripDays = legRows.reduce((sum, l) => sum + l.days, 0);

  const countryItems = [...countryMap.entries()]
    .filter(([, c]) => c.total > 0)
    .map(([name, c]) => ({
      key: name,
      label: name,
      icon: c.flag,
      value: c.total,
      detail:
        c.days > 0
          ? `${c.days} ${c.days === 1 ? "day" : "days"} so far · ${formatEuro(c.total / c.days)} per day`
          : undefined,
    }));
  if (noLegTotal > 0) {
    countryItems.push({ key: NO_LEG, label: "Not tied to a leg", icon: "🌍", value: noLegTotal, detail: undefined });
  }
  countryItems.sort((a, b) => b.value - a.value);

  const selectedTotal = byCategory.reduce((sum, r) => sum + Number(r.total), 0);
  const categoryItems = CATEGORIES.map((c) => ({
    key: c.id,
    label: c.label,
    icon: c.icon,
    value: Number(byCategory.find((r) => r.category === c.id)?.total ?? 0),
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Fill the months with no spending so the time axis has no holes.
  const monthItems: ColumnItem[] = [];
  if (byMonth.length > 0) {
    const values = new Map(byMonth.map((r) => [r.month, Number(r.total)]));
    const last = byMonth[byMonth.length - 1].month;
    for (let m = byMonth[0].month; m <= last && monthItems.length < 36; m = nextMonth(m)) {
      monthItems.push({ key: m, label: formatMonth(m), value: values.get(m) ?? 0 });
    }
  }

  const selectedLabel =
    country === NO_LEG ? "Not tied to a leg" : country && countryMap.has(country) ? country : "";
  const chips = [
    { href: "/dashboard", label: "All", active: !country },
    ...countryNames.map((name) => ({
      href: `/dashboard?country=${encodeURIComponent(name)}`,
      label: `${countryMap.get(name)!.flag} ${name}`,
      active: country === name,
    })),
    ...(noLegTotal > 0
      ? [{ href: `/dashboard?country=${NO_LEG}`, label: "Not tied to a leg", active: country === NO_LEG }]
      : []),
  ];

  if (grandCount === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="card px-4 py-8 text-center text-muted">
          Totals appear here once you add your first expense.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="card p-4" aria-label="Trip total">
        <p className="text-sm text-muted">Total spent</p>
        <p className="tabular text-4xl font-semibold tracking-tight">{formatEuro(grandTotal)}</p>
        <p className="tabular mt-1 text-sm text-muted">
          {grandCount} {grandCount === 1 ? "expense" : "expenses"}
          {tripDays > 0 &&
            ` · day ${tripDays} of the trip · ${formatEuro(grandTotal / tripDays)} per day`}
        </p>
      </section>

      <nav aria-label="Filter by country" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 whitespace-nowrap">
          {chips.map((chip) => (
            <li key={chip.href}>
              <Link
                href={chip.href}
                aria-current={chip.active ? "true" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm ${
                  chip.active
                    ? "border-accent bg-accent font-semibold text-accent-ink"
                    : "border-line bg-surface"
                }`}
              >
                {chip.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="card p-4" aria-labelledby="category-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="category-heading" className="font-semibold">
            By category{selectedLabel && `: ${selectedLabel}`}
          </h2>
          {selectedLabel && <span className="tabular text-sm text-muted">{formatEuro(selectedTotal)}</span>}
        </div>
        {categoryItems.length > 0 ? (
          <BarList items={categoryItems} total={selectedTotal} />
        ) : (
          <p className="text-sm text-muted">Nothing spent here yet.</p>
        )}
      </section>

      {monthItems.length > 0 && (
        <section className="card p-4" aria-labelledby="month-heading">
          <h2 id="month-heading" className="mb-4 font-semibold">
            By month{selectedLabel && `: ${selectedLabel}`}
          </h2>
          <ColumnChart
            items={monthItems}
            label={`Spending in euro by month. ${monthItems
              .map((m) => `${m.label} ${formatEuro(m.value)}`)
              .join(", ")}.`}
          />
        </section>
      )}

      <section className="card p-4" aria-labelledby="country-heading">
        <h2 id="country-heading" className="mb-4 font-semibold">
          By country
        </h2>
        <BarList items={countryItems} total={grandTotal} />
      </section>

      <section className="card overflow-hidden" aria-labelledby="leg-heading">
        <h2 id="leg-heading" className="px-4 pt-4 font-semibold">
          By trip leg
        </h2>
        <table className="tabular mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-4 py-2 font-medium">Leg</th>
              <th className="px-2 py-2 text-right font-medium">Per day</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {legRows
              .filter((l) => l.total > 0 || l.days > 0)
              .map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="px-4 py-2">
                    <span className="block">
                      {l.flag} {l.cities}
                    </span>
                    <span className="block text-xs text-muted">
                      {formatShortDate(l.startDate)} to {formatShortDate(l.endDate)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-muted">
                    {l.days > 0 ? formatEuro(l.total / l.days) : ""}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{formatEuro(l.total)}</td>
                </tr>
              ))}
            {noLegTotal > 0 && (
              <tr className="border-t border-line">
                <td className="px-4 py-2">Not tied to a leg</td>
                <td />
                <td className="px-4 py-2 text-right font-semibold">{formatEuro(noLegTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
