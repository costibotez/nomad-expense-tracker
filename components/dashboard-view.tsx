import { routes } from "@/lib/routes";
import { eq, isNull, sql, type SQL } from "drizzle-orm";
import { Download, Plus, ReceiptText, Share2 } from "lucide-react";
import Link from "next/link";
import { CardCarousel, type CarouselItem } from "@/components/card-carousel";
import { ColumnChart, type ColumnItem } from "@/components/charts";
import { Hero, HeroButton, Panel, RoundAction } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs } from "@/lib/db/schema";
import { daysBetween, formatEuro, formatMonth, formatShortDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { currencyName } from "@/lib/places";
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

function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}


/** Category shares use five shades. Categories past the fourth share the lightest one. */
const SHADES = ["var(--seg-1)", "var(--seg-2)", "var(--seg-3)", "var(--seg-4)", "var(--seg-5)"];

/**
 * The totals and charts, shared by the signed-in overview and the public share page.
 * It shows aggregates only, never single expenses or notes.
 */
export async function DashboardView({
  country,
  basePath,
  heading,
  intro,
  readOnly = false,
}: {
  country: string;
  basePath: string;
  heading: string;
  intro?: string;
  readOnly?: boolean;
}) {
  const [allLegs, byLeg] = await Promise.all([
    getLegs(),
    db.select({ legId: expenses.legId, total, count }).from(expenses).groupBy(expenses.legId),
  ]);

  const today = serverToday();
  const legTotals = new Map(byLeg.map((r) => [r.legId, { total: Number(r.total), count: r.count }]));
  const noLegTotal = legTotals.get(null)?.total ?? 0;
  const countryNames = [...new Set(allLegs.map((l) => l.country))];

  // An unknown country falls back to the whole trip.
  const scope =
    country === NO_LEG && noLegTotal > 0 ? NO_LEG : countryNames.includes(country) ? country : "";
  const filter: SQL | undefined =
    scope === NO_LEG ? isNull(expenses.legId) : scope ? eq(legs.country, scope) : undefined;

  const [byCategory, byMonth] = await Promise.all([
    db
      .select({ category: expenses.category, total, count })
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

  const legRows = allLegs.map((leg) => ({
    ...leg,
    total: legTotals.get(leg.id)?.total ?? 0,
    days: daysBetween(leg.startDate, leg.endDate),
    elapsed: elapsedDays(leg.startDate, leg.endDate, today),
  }));
  const grandTotal = legRows.reduce((sum, l) => sum + l.total, 0) + noLegTotal;
  const scopeLegs = scope === NO_LEG ? [] : scope ? legRows.filter((l) => l.country === scope) : legRows;

  const hrefFor = (key: string) => (key ? `${basePath}?country=${encodeURIComponent(key)}` : basePath);

  // The cards: the whole trip, then each country in itinerary order.
  const first = legRows[0];
  const last = legRows[legRows.length - 1];
  const cards: CarouselItem[] = [
    {
      key: "",
      href: hrefFor(""),
      label: "Whole trip",
      name: first && last ? `${formatShortDate(first.startDate)} to ${formatShortDate(last.endDate)}` : "Nomad Expenses",
      mark: "EUR",
      markCaption: "All amounts in euro",
    },
    ...countryNames.map((name) => {
      const own = legRows.filter((l) => l.country === name);
      return {
        key: name,
        href: hrefFor(name),
        label: `${own[0].flag} ${name}`,
        name: [...new Set(own.map((l) => l.cities))].join(" / "),
        mark: own[0].currency,
        markCaption: currencyName(own[0].currency),
      };
    }),
  ];
  if (noLegTotal > 0) {
    cards.push({
      key: NO_LEG,
      href: hrefFor(NO_LEG),
      label: "Not tied to a leg",
      name: "Flights and bookings",
      mark: "EUR",
      markCaption: "Euro",
    });
  }
  const activeIndex = Math.max(0, cards.findIndex((c) => c.key === scope));

  // Numbers for the selected card.
  const scopeTotal = byCategory.reduce((sum, r) => sum + Number(r.total), 0);
  const scopeCount = byCategory.reduce((sum, r) => sum + r.count, 0);
  const scopeDays = scopeLegs.reduce((sum, l) => sum + l.days, 0);
  const scopeElapsed = scopeLegs.reduce((sum, l) => sum + l.elapsed, 0);
  const scopeTitle = scope === NO_LEG ? "Not tied to a leg" : scope || "Whole trip";
  const scopeSubtitle =
    scope === NO_LEG
      ? "Bookings made outside the trip dates"
      : `${plural(scopeLegs.length, "leg")} · ${plural(scopeDays, "day")}`;

  let progressCaption = plural(scopeCount, "expense");
  if (scopeDays > 0) {
    const firstStart = scopeLegs[0].startDate;
    if (scopeElapsed === 0) {
      const wait = daysBetween(today, firstStart) - 1;
      progressCaption = `Starts in ${plural(wait, "day")}`;
    } else if (scopeElapsed < scopeDays) {
      progressCaption = `Day ${scopeElapsed} of ${scopeDays} · ${plural(scopeDays - scopeElapsed, "day")} left`;
    } else {
      progressCaption = `Finished after ${plural(scopeDays, "day")}`;
    }
  }

  const categoryItems = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    value: Number(byCategory.find((r) => r.category === c.id)?.total ?? 0),
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((c, i) => ({ ...c, shade: SHADES[Math.min(i, SHADES.length - 1)] }));

  // The segmented bar shows the top four categories and puts the rest together.
  const segments: { key: string; label: string; value: number; shade: string }[] = categoryItems
    .slice(0, 4).map((c) => ({ key: c.id, label: c.label, value: c.value, shade: c.shade }));
  const rest = categoryItems.slice(4).reduce((sum, c) => sum + c.value, 0);
  if (rest > 0) segments.push({ key: "rest", label: "Everything else", value: rest, shade: SHADES[4] });

  const monthItems: ColumnItem[] = [];
  if (byMonth.length > 0) {
    const values = new Map(byMonth.map((r) => [r.month, Number(r.total)]));
    const lastMonth = byMonth[byMonth.length - 1].month;
    for (let m = byMonth[0].month; m <= lastMonth && monthItems.length < 36; m = nextMonth(m)) {
      monthItems.push({ key: m, label: formatMonth(m), value: values.get(m) ?? 0 });
    }
  }

  const countryRows = countryNames
    .map((name) => {
      const own = legRows.filter((l) => l.country === name);
      return { key: name, label: name, flag: own[0].flag, value: own.reduce((s, l) => s + l.total, 0) };
    })
    .filter((c) => c.value > 0);
  if (noLegTotal > 0) countryRows.push({ key: NO_LEG, label: "Not tied to a leg", flag: "🌍", value: noLegTotal });
  countryRows.sort((a, b) => b.value - a.value);

  const pct = (value: number, of: number) => (of > 0 ? Math.round((value / of) * 100) : 0);

  return (
    <div className="flex flex-col gap-5">
      <Hero
        title={heading}
        subtitle={intro}
        action={
          readOnly ? undefined : (
            <HeroButton href={routes.app} label="Add expense">
              <Plus size={20} aria-hidden />
            </HeroButton>
          )
        }
      >
        <CardCarousel items={cards} activeKey={cards[activeIndex].key} />
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{scopeTitle}</p>
            <p className="truncate text-xs text-hero-muted">{scopeSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1" aria-hidden>
            {cards.map((c, i) => (
              <span
                key={c.key}
                className={`h-1.5 rounded-full ${i === activeIndex ? "w-5 bg-hero-ink" : "w-1.5 bg-hero-muted/50"}`}
              />
            ))}
          </div>
        </div>
      </Hero>

      {!readOnly && (
        <nav aria-label="Actions" className="grid grid-cols-4 gap-2 px-1">
          <RoundAction href={routes.app} label="Add" icon={<Plus size={20} strokeWidth={1.75} aria-hidden />} />
          <RoundAction
            href={scope ? `${routes.expenses}?country=${encodeURIComponent(scope)}` : routes.expenses}
            label="Expenses"
            icon={<ReceiptText size={20} strokeWidth={1.75} aria-hidden />}
          />
          <RoundAction href={routes.export} label="Export" download icon={<Download size={20} strokeWidth={1.75} aria-hidden />} />
          <RoundAction href={`${routes.trip}#share`} label="Share" icon={<Share2 size={20} strokeWidth={1.75} aria-hidden />} />
        </nav>
      )}

      <section className="card p-5" aria-label={`Spent: ${scopeTitle}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Spent so far</p>
            <p className="tabular text-[32px] leading-tight font-semibold tracking-tight">{formatEuro(scopeTotal)}</p>
          </div>
          {scopeElapsed > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted">Per day</p>
              <p className="tabular mt-1 font-semibold">{formatEuro(scopeTotal / scopeElapsed)}</p>
            </div>
          )}
        </div>
        {scopeDays > 0 && (
          <div
            className="mt-4 h-1.5 rounded-full bg-track"
            role="progressbar"
            aria-label="Days of this part of the trip"
            aria-valuemin={0}
            aria-valuemax={scopeDays}
            aria-valuenow={scopeElapsed}
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${(scopeElapsed / scopeDays) * 100}%` }} />
          </div>
        )}
        <p className="tabular mt-2 text-xs text-muted">
          {progressCaption}
          {scopeDays > 0 && ` · ${plural(scopeCount, "expense")}`}
        </p>
      </section>

      {scopeCount === 0 ? (
        <p className="card px-5 py-8 text-center text-muted">
          {readOnly ? "No expenses have been recorded here yet." : "No expenses here yet. Tap Add to log one."}
        </p>
      ) : (
        <>
          <Panel id="category-heading" title="By category">
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
              {segments.map((s) => (
                <span
                  key={s.key}
                  className="h-full rounded-full"
                  style={{ flexGrow: s.value, flexBasis: 0, minWidth: 6, background: s.shade }}
                  title={`${s.label}: ${formatEuro(s.value)}`}
                />
              ))}
            </div>
            <ul className="mt-4 flex flex-col">
              {categoryItems.map((c) => (
                <li key={c.id} className="flex min-h-12 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink">
                    <CategoryIcon id={c.id} size={17} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: c.shade }} aria-hidden />
                    <span className="truncate">{c.label}</span>
                  </span>
                  <span className="tabular text-sm font-semibold">{formatEuro(c.value)}</span>
                  <span className="tabular w-9 text-right text-xs text-muted">{pct(c.value, scopeTotal)}%</span>
                </li>
              ))}
            </ul>
          </Panel>

          {monthItems.length > 0 && (
            <Panel id="month-heading" title="By month">
              <ColumnChart
                items={monthItems}
                label={`Spending in euro by month. ${monthItems
                  .map((m) => `${m.label} ${formatEuro(m.value)}`)
                  .join(", ")}.`}
              />
            </Panel>
          )}

          {!scope && countryRows.length > 0 && (
            <Panel id="country-heading" title="By country">
              <ul className="-mx-2 flex flex-col">
                {countryRows.map((c) => (
                  <li key={c.key}>
                    <Link
                      href={hrefFor(c.key)}
                      scroll={false}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-2"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line text-lg" aria-hidden>
                        {c.flag}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{c.label}</span>
                      <span className="tabular text-sm font-semibold">{formatEuro(c.value)}</span>
                      <span className="tabular w-9 text-right text-xs text-muted">{pct(c.value, grandTotal)}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {scopeLegs.some((l) => l.total > 0 || l.elapsed > 0) && (
            <Panel id="leg-heading" title="By trip leg">
              <ul className="flex flex-col divide-y divide-line">
                {scopeLegs
                  .filter((l) => l.total > 0 || l.elapsed > 0)
                  .map((l) => (
                    <li key={l.id} className="tabular flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {l.flag} {l.cities}
                        </span>
                        <span className="block text-xs text-muted">
                          {formatShortDate(l.startDate)} to {formatShortDate(l.endDate)}
                          {l.elapsed > 0 && ` · ${formatEuro(l.total / l.elapsed)} per day`}
                        </span>
                      </span>
                      <span className="text-sm font-semibold">{formatEuro(l.total)}</span>
                    </li>
                  ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
