import { sql } from "drizzle-orm";
import { logout } from "@/app/actions";
import { LegForm } from "@/components/leg-form";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { daysBetween, formatEuro, formatShortDate } from "@/lib/format";
import { getLegs, serverToday } from "@/lib/queries";

export default async function TripPage() {
  const [legs, totals] = await Promise.all([
    getLegs(),
    db
      .select({
        legId: expenses.legId,
        total: sql<string>`coalesce(sum(${expenses.amountEur}), 0)`,
      })
      .from(expenses)
      .groupBy(expenses.legId),
  ]);
  const spent = new Map(totals.map((t) => [t.legId, Number(t.total)]));
  const today = serverToday();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Trip</h1>
      <p className="text-sm text-muted">
        New expenses pick the leg and currency that match their date. Open a leg to change its
        dates if your plans move.
      </p>

      <ol className="flex flex-col gap-2">
        {legs.map((leg) => {
          const current = leg.startDate <= today && today <= leg.endDate;
          const days = daysBetween(leg.startDate, leg.endDate);
          return (
            <li key={leg.id} className={`card overflow-hidden ${current ? "border-accent" : ""}`}>
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  <span aria-hidden className="text-2xl">
                    {leg.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {leg.country}
                      {current && (
                        <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">
                          Now
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">{leg.cities}</span>
                    <span className="tabular block text-xs text-muted">
                      {leg.startDate === leg.endDate
                        ? formatShortDate(leg.startDate)
                        : `${formatShortDate(leg.startDate)} to ${formatShortDate(leg.endDate)}`}{" "}
                      · {days} {days === 1 ? "day" : "days"} · {leg.currency}
                    </span>
                  </span>
                  <span className="tabular text-sm font-semibold">
                    {formatEuro(spent.get(leg.id) ?? 0)}
                  </span>
                </summary>
                <LegForm leg={leg} />
              </details>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2">
        <a
          href="/api/export"
          className="flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface font-medium"
        >
          Export all expenses as a spreadsheet
        </a>
        <form action={logout}>
          <button className="min-h-12 w-full rounded-xl border border-line font-medium text-muted">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
