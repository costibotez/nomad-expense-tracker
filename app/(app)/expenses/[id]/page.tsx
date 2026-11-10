import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpense } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { ExpenseForm } from "@/components/expense-form";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { getLegs, serverToday } from "@/lib/queries";

export default async function EditExpensePage({ params }: PageProps<"/expenses/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [[expense], legs] = await Promise.all([
    db.select().from(expenses).where(eq(expenses.id, id)),
    getLegs(),
  ]);
  if (!expense) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Edit expense</h1>
        <Link href="/expenses" className="text-sm text-accent underline">
          Back to list
        </Link>
      </div>
      <ExpenseForm legs={legs} expense={expense} serverToday={serverToday()} />
      <form action={deleteExpense}>
        <input type="hidden" name="id" value={expense.id} />
        <ConfirmButton
          message="Delete this expense? This cannot be undone."
          className="min-h-12 w-full rounded-xl border border-line text-base font-medium text-danger"
        >
          Delete expense
        </ConfirmButton>
      </form>
    </div>
  );
}
