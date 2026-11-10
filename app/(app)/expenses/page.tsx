import { and, desc, eq, isNull, type SQL } from "drizzle-orm";
import { ExpenseRow } from "@/components/expense-row";
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
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <a href="/api/export" className="text-sm text-accent underline">
          Export spreadsheet
        </a>
      </div>

      <form className="grid grid-cols-[1fr_1fr_auto] gap-2" method="get">
        <select className="field" name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select className="field" name="country" defaultValue={country} aria-label="Country">
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={NO_LEG}>Not tied to a leg</option>
        </select>
        <button className="min-h-11 rounded-xl border border-line bg-surface px-4 text-sm font-medium">
          Filter
        </button>
      </form>

      <p className="tabular text-sm text-muted">
        {rows.length} {rows.length === 1 ? "expense" : "expenses"}
        {filtered ? " matching" : ""} · <strong className="text-ink">{formatEuro(total)}</strong>
      </p>

      {days.length === 0 && (
        <p className="card px-4 py-8 text-center text-muted">
          {filtered ? "Nothing matches these filters." : "No expenses yet. Add your first one."}
        </p>
      )}

      {days.map((day) => (
        <section key={day.date} aria-label={formatDay(day.date)}>
          <h2 className="tabular mb-2 flex justify-between text-sm font-medium text-muted">
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
