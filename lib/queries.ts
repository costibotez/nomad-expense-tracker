import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { expenses, legs } from "./db/schema";

export function getLegs() {
  return db.select().from(legs).orderBy(asc(legs.startDate), asc(legs.id));
}

export const expenseRow = {
  id: expenses.id,
  date: expenses.date,
  amount: expenses.amount,
  currency: expenses.currency,
  category: expenses.category,
  note: expenses.note,
  legId: expenses.legId,
  rate: expenses.rate,
  amountEur: expenses.amountEur,
  country: legs.country,
  flag: legs.flag,
};

export function expensesWithLeg() {
  return db.select(expenseRow).from(expenses).leftJoin(legs, eq(expenses.legId, legs.id));
}

export function recentExpenses(limit: number) {
  return expensesWithLeg().orderBy(desc(expenses.createdAt), desc(expenses.id)).limit(limit);
}

export const serverToday = () => new Date().toISOString().slice(0, 10);

/** Value used in filters for expenses that are not tied to a trip leg. */
export const NO_LEG = "none";
