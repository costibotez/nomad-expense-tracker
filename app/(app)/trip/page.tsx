import { desc, sql } from "drizzle-orm";
import { createShareLink, logout } from "@/app/actions";
import { LegForm } from "@/components/leg-form";
import { ShareLinkRow } from "@/components/share-link-row";
import { db } from "@/lib/db";
import { expenses, shareLinks } from "@/lib/db/schema";
import { daysBetween, formatEuro, formatShortDate } from "@/lib/format";
import { getLegs, serverToday } from "@/lib/queries";

export default async function TripPage() {
  const [legs, totals, links] = await Promise.all([
    getLegs(),
    db
      .select({
        legId: expenses.legId,
        total: sql<string>`coalesce(sum(${expenses.amountEur}), 0)`,
      })
      .from(expenses)
      .groupBy(expenses.legId),
    db.select().from(shareLinks).orderBy(desc(shareLinks.createdAt)),
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

      <section aria-labelledby="share-heading" className="flex flex-col gap-2">
        <h2 id="share-heading" className="text-lg font-semibold">
          Share
        </h2>
        <p className="text-sm text-muted">
          A share link opens a read-only page with the trip totals and charts. It needs no
          password and does not show single expenses or notes. Anyone who has the link can open
          it until you switch it off.
        </p>
        {links.length > 0 && (
          <ul className="card divide-y divide-line">
            {links.map((link) => (
              <ShareLinkRow
                key={link.id}
                id={link.id}
                token={link.token}
                created={formatShortDate(link.createdAt.toISOString().slice(0, 10))}
              />
            ))}
          </ul>
        )}
        <form action={createShareLink}>
          <button className="min-h-12 w-full rounded-xl border border-line bg-surface font-medium">
            Create a share link
          </button>
        </form>
      </section>

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
