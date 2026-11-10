"use server";

import { routes } from "@/lib/routes";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCorrectPassword, isValidSession, SESSION_COOKIE, sessionToken } from "@/lib/auth";
import { CATEGORY_IDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs, settings, shareLinks } from "@/lib/db/schema";
import { isIsoDate } from "@/lib/format";
import { countryByCode, isCurrencyCode } from "@/lib/places";
import { fetchRate } from "@/lib/rates";
import sampleTrip from "@/lib/sample-trip.json";

export type FormState = { error?: string } | undefined;

async function requireSession() {
  const store = await cookies();
  if (!isValidSession(store.get(SESSION_COOKIE)?.value)) redirect(routes.login);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts both 12.50 and 12,50 and ignores spaces used as thousands separators. */
function parseNumber(raw: string) {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = sessionToken();
  if (!token) {
    return { error: "No password is configured. Set APP_PASSWORD in the project settings." };
  }
  if (!isCorrectPassword(text(formData, "password"))) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Wrong password." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // A fresh install starts with the walkthrough.
  const [row] = await db.select({ done: settings.setupDoneAt }).from(settings).where(eq(settings.id, 1));
  redirect(row?.done ? routes.app : routes.setup);
}

/** Step one of the walkthrough. An empty name is fine. */
export async function saveSetupName(formData: FormData) {
  await requireSession();
  const name = text(formData, "name").slice(0, 40);
  await db.insert(settings).values({ id: 1, name }).onConflictDoUpdate({ target: settings.id, set: { name } });
  redirect(`${routes.setup}?step=trip`);
}

/** Fills an empty trip with the sample itinerary, to look around before planning your own. */
export async function loadSampleTrip() {
  await requireSession();
  const existing = await db.select({ id: legs.id }).from(legs).limit(1);
  if (existing.length === 0) await db.insert(legs).values(sampleTrip);
  revalidatePath(routes.app, "layout");
  redirect(`${routes.setup}?step=done`);
}

/** Ends the walkthrough, whether its steps were filled in or skipped. */
export async function finishSetup() {
  await requireSession();
  const setupDoneAt = new Date();
  await db
    .insert(settings)
    .values({ id: 1, setupDoneAt })
    .onConflictDoUpdate({ target: settings.id, set: { setupDoneAt } });
  revalidatePath(routes.app, "layout");
  redirect(routes.app);
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect(routes.login);
}

export async function saveExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const idRaw = text(formData, "id");
  const id = idRaw ? Number(idRaw) : null;
  const amount = parseNumber(text(formData, "amount"));
  const currency = text(formData, "currency");
  const category = text(formData, "category");
  const date = text(formData, "date");
  const note = text(formData, "note").slice(0, 300);
  const legRaw = text(formData, "legId");
  const rateRaw = text(formData, "rate");

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above zero." };
  if (amount >= 1e13) return { error: "That amount is too large." };
  if (!isCurrencyCode(currency)) return { error: "Choose a currency." };
  if (!CATEGORY_IDS.includes(category)) return { error: "Choose a category." };
  if (!isIsoDate(date)) return { error: "Choose a valid date." };
  if (id !== null && !Number.isInteger(id)) return { error: "Unknown expense." };

  let legId: number | null = null;
  if (legRaw) {
    legId = Number(legRaw);
    const [leg] = Number.isInteger(legId)
      ? await db.select({ id: legs.id }).from(legs).where(eq(legs.id, legId))
      : [];
    if (!leg) return { error: "Choose a valid trip leg." };
  }

  let rate: number | null;
  if (currency === "EUR") {
    rate = 1;
  } else if (rateRaw) {
    rate = parseNumber(rateRaw);
    if (!Number.isFinite(rate) || rate <= 0) return { error: "The exchange rate must be above zero." };
  } else {
    rate = await fetchRate(currency, date);
    if (!rate) {
      return {
        error: `Could not look up the ${currency} rate. Type how many ${currency} one euro buys.`,
      };
    }
  }

  const amountEur = Math.round((amount / rate) * 100) / 100;
  if (amountEur >= 1e12) return { error: "That amount is too large." };

  const values = {
    date,
    amount: amount.toFixed(2),
    currency,
    category,
    note,
    legId,
    rate: rate.toFixed(8),
    amountEur: amountEur.toFixed(2),
  };

  let savedId = id;
  if (id === null) {
    const [row] = await db.insert(expenses).values(values).returning({ id: expenses.id });
    savedId = row.id;
  } else {
    const updated = await db
      .update(expenses)
      .set(values)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });
    if (updated.length === 0) return { error: "This expense no longer exists." };
  }

  revalidatePath(routes.app, "layout");
  redirect(id === null ? `${routes.app}?saved=${savedId}` : routes.expenses);
}

/**
 * Adds a copy of an expense dated today: same amount, currency, category and
 * note. The trip leg and the exchange rate follow the new date.
 */
export async function repeatExpense(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, "id"));
  const dateRaw = text(formData, "date");
  const date = isIsoDate(dateRaw) ? dateRaw : new Date().toISOString().slice(0, 10);

  const [source] = Number.isInteger(id) ? await db.select().from(expenses).where(eq(expenses.id, id)) : [];
  if (!source) redirect(routes.app);

  const [leg] = await db
    .select({ id: legs.id })
    .from(legs)
    .where(and(lte(legs.startDate, date), gte(legs.endDate, date)))
    .orderBy(asc(legs.startDate), asc(legs.id))
    .limit(1);

  // Without a rate for the new day the rate of the original expense is close
  // enough, and it can be corrected by editing the copy.
  const amount = Number(source.amount);
  const rate =
    source.currency === "EUR" || source.date === date
      ? Number(source.rate)
      : ((await fetchRate(source.currency, date)) ?? Number(source.rate));

  const [row] = await db
    .insert(expenses)
    .values({
      date,
      amount: source.amount,
      currency: source.currency,
      category: source.category,
      note: source.note,
      legId: leg?.id ?? null,
      rate: rate.toFixed(8),
      amountEur: (Math.round((amount / rate) * 100) / 100).toFixed(2),
    })
    .returning({ id: expenses.id });

  revalidatePath(routes.app, "layout");
  redirect(`${routes.app}?saved=${row.id}&repeated=1`);
}

export async function deleteExpense(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, "id"));
  if (Number.isInteger(id)) {
    await db.delete(expenses).where(eq(expenses.id, id));
  }
  revalidatePath(routes.app, "layout");
  // Undoing a repeat on the Add screen stays on the Add screen.
  if (text(formData, "back") === "add") redirect(routes.app);
  // A delete from the list keeps the filters that were in use.
  const query = new URLSearchParams();
  for (const key of ["category", "country"]) {
    const value = text(formData, key);
    if (value) query.set(key, value);
  }
  redirect(query.size > 0 ? `${routes.expenses}?${query}` : routes.expenses);
}

function readLeg(formData: FormData) {
  const country = countryByCode(text(formData, "country"));
  const cities = text(formData, "cities").slice(0, 200);
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const currency = text(formData, "currency");

  if (!country) return { error: "Choose a country." } as const;
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return { error: "Choose valid dates." } as const;
  if (endDate < startDate) return { error: "The end date is before the start date." } as const;
  if (!isCurrencyCode(currency)) return { error: "Choose a currency." } as const;

  return {
    values: { country: country.name, flag: country.flag, cities, startDate, endDate, currency },
  } as const;
}

export async function saveLeg(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const idRaw = text(formData, "id");
  const leg = readLeg(formData);
  if ("error" in leg) return { error: leg.error };

  if (idRaw) {
    const id = Number(idRaw);
    if (!Number.isInteger(id)) return { error: "Unknown trip leg." };
    const updated = await db.update(legs).set(leg.values).where(eq(legs.id, id)).returning({ id: legs.id });
    if (updated.length === 0) return { error: "This leg no longer exists." };
  } else {
    await db.insert(legs).values(leg.values);
  }
  revalidatePath(routes.app, "layout");
  // The walkthrough carries on to its last step.
  redirect(text(formData, "from") === "setup" ? `${routes.setup}?step=done` : routes.trip);
}

/** Expenses of a deleted leg stay, as "not tied to a leg". */
export async function deleteLeg(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, "id"));
  if (Number.isInteger(id)) {
    await db.delete(legs).where(eq(legs.id, id));
  }
  revalidatePath(routes.app, "layout");
  redirect(routes.trip);
}

export async function createShareLink() {
  await requireSession();
  // 192 random bits, so a link cannot be guessed.
  await db.insert(shareLinks).values({ token: randomBytes(24).toString("base64url") });
  revalidatePath(routes.trip);
}

export async function revokeShareLink(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, "id"));
  if (Number.isInteger(id)) {
    await db.delete(shareLinks).where(eq(shareLinks.id, id));
  }
  revalidatePath(routes.trip);
}
