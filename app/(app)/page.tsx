import { eq } from "drizzle-orm";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseRow } from "@/components/expense-row";
import { categoryOf } from "@/lib/constants";
import { expenses } from "@/lib/db/schema";
import { formatAmount, formatEuro, formatShortDate } from "@/lib/format";
import { expensesWithLeg, getLegs, recentExpenses, serverToday } from "@/lib/queries";

export default async function AddPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const savedId = typeof params.saved === "string" ? Number(params.saved) : NaN;

  const [legs, recent, savedRows] = await Promise.all([
    getLegs(),
    recentExpenses(5),
    Number.isInteger(savedId) ? expensesWithLeg().where(eq(expenses.id, savedId)) : [],
  ]);
  const saved = savedRows[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add expense</h1>

      {saved && (
        <p role="status" className="card tabular border-accent px-4 py-3 text-sm">
          Saved {categoryOf(saved.category).label.toLowerCase()}:{" "}
          <strong>{formatAmount(Number(saved.amount), saved.currency)}</strong>
          {saved.currency !== "EUR" && ` (${formatEuro(Number(saved.amountEur))})`}
        </p>
      )}

      {/* The key gives a clean form after each save. */}
      <ExpenseForm key={saved?.id ?? "new"} legs={legs} serverToday={serverToday()} />

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-2 text-sm font-medium text-muted">
            Recently added
          </h2>
          <ul className="card divide-y divide-line">
            {recent.map((e) => (
              <li key={e.id}>
                <ExpenseRow expense={e} detail={formatShortDate(e.date)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
