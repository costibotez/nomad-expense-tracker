import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteExpense } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { ExpenseForm } from "@/components/expense-form";
import { HeroButton } from "@/components/ui";
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
      <ExpenseForm
        legs={legs}
        expense={expense}
        serverToday={serverToday()}
        title="Edit expense"
        headerAction={
          <HeroButton href="/expenses" label="Back to expenses">
            <ArrowLeft size={20} aria-hidden />
          </HeroButton>
        }
      />
      <form action={deleteExpense}>
        <input type="hidden" name="id" value={expense.id} />
        <ConfirmButton
          message="Delete this expense? This cannot be undone."
          className="min-h-14 w-full rounded-full border border-line bg-surface text-base font-medium text-danger"
        >
          Delete expense
        </ConfirmButton>
      </form>
    </div>
  );
}
