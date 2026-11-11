import { routes } from "@/lib/routes";
import { desc, sql } from "drizzle-orm";
import { Download, GripVertical, Link2, LogOut, Plus } from "lucide-react";
import { createShareLink, logout, reorderLegs } from "@/app/actions";
import { LegForm } from "@/components/leg-form";
import { ShareLinkRow } from "@/components/share-link-row";
import { SortableList } from "@/components/sortable-list";
import { Hero, TripCard } from "@/components/ui";
import { db } from "@/lib/db";
import { expenses, shareLinks } from "@/lib/db/schema";
import { daysBetween, formatEuro, formatShortDate } from "@/lib/format";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS, currencyName } from "@/lib/places";
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

  // The card shows the leg you are in, or the next one before the trip starts.
  const current = legs.find((l) => l.startDate <= today && today <= l.endDate);
  const featured = current ?? legs.find((l) => l.startDate > today) ?? legs[legs.length - 1];
  const countries = new Set(legs.map((l) => l.country)).size;
  const tripDays = legs.length > 0 ? daysBetween(legs[0].startDate, legs[legs.length - 1].endDate) : 0;

  // A new leg starts the day after the last one ends and lasts a week.
  const addDays = (iso: string, n: number) =>
    new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const lastEnd = legs.length > 0 ? legs.reduce((max, l) => (l.endDate > max ? l.endDate : max), legs[0].endDate) : today;
  const newLegDefaults = { startDate: addDays(lastEnd, 1), endDate: addDays(lastEnd, 7) };

  return (
    <div className="flex flex-col gap-5">
      <Hero
        title="Trip"
        subtitle={`${legs.length} legs · ${countries} countries · ${tripDays} days`}
      >
        {featured && (
          <>
            <div className="mt-5">
              <TripCard
                label={`${featured.flag} ${featured.country}`}
                name={featured.cities}
                mark={featured.currency}
                markCaption={currencyName(featured.currency)}
                stacked
              />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{current ? "Current leg" : "Next leg"}</p>
                <p className="tabular truncate text-xs text-hero-muted">
                  {formatShortDate(featured.startDate)} to {formatShortDate(featured.endDate)}
                  {current
                    ? ` · ${daysBetween(today, featured.endDate) - 1} days left`
                    : ` · starts in ${daysBetween(today, featured.startDate) - 1} days`}
                </p>
              </div>
              <p className="tabular shrink-0 text-sm font-semibold">{formatEuro(spent.get(featured.id) ?? 0)}</p>
            </div>
          </>
        )}
      </Hero>

      <p className="px-1 text-sm text-muted">
        New expenses pick the leg and currency that match their date. Tap a leg to change its
        country, places, dates or currency, or to delete it. Drag a leg by its handle, or press and
        hold it, to move it up or down. Every leg keeps its number of days and the dates follow
        the new order.
      </p>

      <SortableList
        className="card divide-y divide-line overflow-hidden"
        reorderAction={reorderLegs}
        items={legs.map((leg) => {
          const isCurrent = leg.id === current?.id;
          const days = daysBetween(leg.startDate, leg.endDate);
          return {
            id: leg.id,
            label: leg.country,
            content: (
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none [-webkit-touch-callout:none]">
                  <span
                    aria-hidden
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl border text-xl ${
                      isCurrent ? "border-accent" : "border-line"
                    }`}
                  >
                    {leg.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {leg.country}
                      {isCurrent && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-ink">Now</span>
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
                  <span className="tabular text-sm font-semibold">{formatEuro(spent.get(leg.id) ?? 0)}</span>
                  {legs.length > 1 && (
                    <button
                      type="button"
                      data-drag-handle
                      aria-label={`Move ${leg.country}. Drag, or use the up and down arrow keys.`}
                      className="-mr-2 flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted"
                    >
                      <GripVertical size={18} aria-hidden />
                    </button>
                  )}
                </summary>
                <LegForm leg={leg} countries={COUNTRY_OPTIONS} currencies={CURRENCY_OPTIONS} />
              </details>
            ),
          };
        })}
        footer={
        <li>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
              >
                <Plus size={20} />
              </span>
              <span className="text-sm font-semibold">Add a leg</span>
            </summary>
            <LegForm countries={COUNTRY_OPTIONS} currencies={CURRENCY_OPTIONS} defaults={newLegDefaults} />
          </details>
        </li>
        }
      />

      <section id="share" aria-labelledby="share-heading" className="card scroll-mt-4 overflow-hidden">
        <div className="flex gap-3 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line">
            <Link2 size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 id="share-heading" className="font-semibold">
              Share
            </h2>
            <p className="mt-1 text-sm text-muted">
              A share link opens a read-only page with the trip totals and charts. It needs no
              password and does not show single expenses or notes. Anyone who has the link can
              open it until you switch it off.
            </p>
          </div>
        </div>
        {links.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
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
        <form action={createShareLink} className="border-t border-line p-4">
          <button className="min-h-12 w-full rounded-full bg-accent font-semibold text-accent-ink">
            Create a share link
          </button>
        </form>
      </section>

      <div className="flex flex-col gap-2">
        <a
          href={routes.export}
          download
          className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-line bg-surface font-medium"
        >
          <Download size={18} aria-hidden />
          Export all expenses as a spreadsheet
        </a>
        <form action={logout}>
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full font-medium text-muted">
            <LogOut size={18} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
