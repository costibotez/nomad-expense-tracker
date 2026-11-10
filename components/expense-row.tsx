import Link from "next/link";
import { categoryOf } from "@/lib/constants";
import { formatAmount, formatEuro } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";

export type RowExpense = {
  id: number;
  amount: string;
  currency: string;
  category: string;
  note: string;
  amountEur: string;
  country: string | null;
  flag: string | null;
};

export function ExpenseRow({ expense, detail }: { expense: RowExpense; detail?: string }) {
  const category = categoryOf(expense.category);
  const secondary = [detail, expense.note || null].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="flex min-h-16 items-center gap-3 px-4 py-2.5"
      aria-label={`Edit ${category.label} ${formatEuro(Number(expense.amountEur))}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink">
        <CategoryIcon id={category.id} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {category.label}
          {expense.flag ? ` ${expense.flag}` : ""}
        </span>
        {secondary && <span className="block truncate text-xs text-muted">{secondary}</span>}
      </span>
      <span className="tabular text-right">
        <span className="block text-sm font-semibold">{formatEuro(Number(expense.amountEur))}</span>
        {expense.currency !== "EUR" && (
          <span className="block text-xs text-muted">
            {formatAmount(Number(expense.amount), expense.currency)}
          </span>
        )}
      </span>
    </Link>
  );
}
