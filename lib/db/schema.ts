import { date, integer, numeric, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const legs = pgTable("legs", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  flag: text("flag").notNull().default(""),
  cities: text("cities").notNull().default(""),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  currency: text("currency").notNull(),
});

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    // Amount in the currency that was actually paid.
    amount: numeric("amount", { precision: 16, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    category: text("category").notNull(),
    note: text("note").notNull().default(""),
    legId: integer("leg_id").references(() => legs.id, { onDelete: "set null" }),
    // Units of the paid currency per one euro, frozen when the expense is saved.
    rate: numeric("rate", { precision: 20, scale: 8 }).notNull(),
    amountEur: numeric("amount_eur", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_date_idx").on(t.date), index("expenses_leg_idx").on(t.legId)],
);

export type Leg = typeof legs.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
