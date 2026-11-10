import { and, desc, eq, isNull, type SQL } from "drizzle-orm";
import { Download } from "lucide-react";
import { ExpenseFilters } from "@/components/expense-filters";
import { ExpenseRow } from "@/components/expense-row";
import { Hero } from "@/components/ui";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/constants";
import { expenses, legs } from "@/lib/db/schema";
import { formatDay, formatEuro } from "@/lib/format";
import { expensesWithLeg, getLegs, NO_LEG } from "@/lib/queries";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const country = typeof params.country === "string" ? params.country : "";

  const filters: SQL[] = [];
  if (CATEGORY_IDS.includes(category)) filters.push(eq(expenses.category, category));
  if (country === NO_LEG) filters.push(isNull(expenses.legId));
  else if (country) filters.push(eq(legs.country, country));

  const [rows, allLegs] = await Promise.all([
    expensesWithLeg()
      .where(and(...filters))
      .orderBy(desc(expenses.date), desc(expenses.id)),
    getLegs(),
  ]);
  const countries = [...new Set(allLegs.map((l) => l.country))];

  const days: { date: string; total: number; rows: typeof rows }[] = [];
  for (const row of rows) {
    let day = days[days.length - 1];
    if (!day || day.date !== row.date) {
      day = { date: row.date, total: 0, rows: [] };
      days.push(day);
    }
    day.rows.push(row);
    day.total += Number(row.amountEur);
  }
  const total = rows.reduce((sum, r) => sum + Number(r.amountEur), 0);
  const filtered = filters.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <Hero
        title="Expenses"
        action={
          <a
            href="/api/export"
            download
            aria-label="Export spreadsheet"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hero-field text-hero-ink"
          >
            <Download size={20} aria-hidden />
          </a>
        }
      >
        <p className="mt-6 text-xs text-hero-muted">{filtered ? "Matching these filters" : "All expenses"}</p>
        <p className="tabular text-[40px] leading-tight font-semibold tracking-tight">{formatEuro(total)}</p>
        <p className="tabular text-sm text-hero-muted">
          {rows.length} {rows.length === 1 ? "expense" : "expenses"}
        </p>
      </Hero>

      <ExpenseFilters
        category={category}
        country={country}
        categories={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
        countries={countries.map((c) => ({ value: c, label: c }))}
        noLegValue={NO_LEG}
      />

      {days.length === 0 && (
        <p className="card px-4 py-8 text-center text-muted">
          {filtered ? "Nothing matches these filters." : "No expenses yet. Add your first one."}
        </p>
      )}

      {days.map((day) => (
        <section key={day.date} aria-label={formatDay(day.date)}>
          <h2 className="tabular mb-2 flex justify-between px-1 text-sm font-medium text-muted">
            <span>{formatDay(day.date)}</span>
            <span>{formatEuro(day.total)}</span>
          </h2>
          <ul className="card divide-y divide-line">
            {day.rows.map((e) => (
              <li key={e.id}>
                <ExpenseRow expense={e} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
