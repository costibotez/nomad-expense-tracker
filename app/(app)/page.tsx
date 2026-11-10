import { eq } from "drizzle-orm";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseRow } from "@/components/expense-row";
import { RepeatButton } from "@/components/repeat-button";
import { deleteExpense } from "@/app/actions";
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
  const repeated = params.repeated === "1";

  return (
    <div className="flex flex-col gap-6">
      {/* The key gives a clean form after each save. */}
      <ExpenseForm key={saved?.id ?? "new"} legs={legs} serverToday={serverToday()} title="Add expense" />

      {saved && (
        <div role="status" className="card tabular flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <p>
            {repeated ? "Added again" : "Saved"} {categoryOf(saved.category).label.toLowerCase()}:{" "}
            <strong>{formatAmount(Number(saved.amount), saved.currency)}</strong>
            {saved.currency !== "EUR" && ` (${formatEuro(Number(saved.amountEur))})`}
          </p>
          {repeated && (
            <form action={deleteExpense}>
              <input type="hidden" name="id" value={saved.id} />
              <input type="hidden" name="back" value="add" />
              <button type="submit" className="min-h-11 px-1 font-semibold underline underline-offset-4">
                Undo
              </button>
            </form>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-1 px-1 text-sm font-medium text-muted">
            Recently added
          </h2>
          <p className="mb-2 px-1 text-xs text-muted">Tap the arrows to add the same expense again today.</p>
          <ul className="card divide-y divide-line">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center">
                <div className="min-w-0 flex-1">
                  <ExpenseRow expense={e} detail={formatShortDate(e.date)} />
                </div>
                <RepeatButton
                  id={e.id}
                  label={`Add ${categoryOf(e.category).label.toLowerCase()} ${formatAmount(Number(e.amount), e.currency)} again today`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
