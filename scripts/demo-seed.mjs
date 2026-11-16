// Fills an empty database with a sample trip and sample expenses for the live demo.
// It runs from migrate.mjs when DEMO_MODE is "1" and never touches a database that has data.
// Every amount below is invented. The same numbers come out on every run.
import { readFile } from "node:fs/promises";

const DAY = 86_400_000;
const toDay = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const fromDay = (day) => new Date(day * DAY).toISOString().slice(0, 10);

/** How far into the trip the demo opens, so the overview has three countries to show. */
const DAYS_INTO_TRIP = 100;

/** Rough units of each currency per euro. Close enough for a demo and no lookup is needed. */
const RATES = { USD: 1.08, THB: 38.2, VND: 27400, JPY: 163.5, CNY: 7.82, UZS: 13900, TJS: 11.6, KGS: 95.4, KZT: 545, RON: 4.98 };
/** Local amounts are rounded the way prices are quoted. */
const STEP = { USD: 0.01, THB: 5, VND: 1000, JPY: 10, CNY: 1, UZS: 1000, TJS: 1, KGS: 10, KZT: 50, RON: 1 };

const NOTES = {
  Thailand: {
    food: ["Khao soi", "Pad thai", "Night market", "Coffee", "Mango sticky rice", "Dinner at the Sunday market"],
    transport: ["Grab", "Scooter fuel", "Songthaew"],
    activities: ["Doi Suthep temple", "Cooking class", "Thai massage", "Elephant sanctuary"],
    shopping: ["Linen shirt", "Phone case"],
    stay: "Monthly rent in Nimman",
  },
  Vietnam: {
    food: ["Pho", "Banh mi", "Iced coffee", "Cao lau", "Seafood dinner", "Bun cha"],
    transport: ["Grab bike", "Taxi", "Scooter rental"],
    activities: ["Lantern boat in Hoi An", "Marble Mountains", "War Remnants Museum"],
    shopping: ["Tailored shirt", "Coffee beans"],
    stay: "One week in a guesthouse",
  },
  Japan: {
    food: ["Ramen", "Konbini breakfast", "Sushi", "Izakaya", "Coffee", "Okonomiyaki"],
    transport: ["Metro", "Suica top up", "Local train"],
    activities: ["teamLab", "Onsen", "Fushimi Inari guide", "Sumo morning practice"],
    shopping: ["Stationery", "Kitchen knife"],
    stay: "Hotel, four nights",
  },
};
const FALLBACK = {
  food: ["Lunch", "Dinner", "Coffee", "Groceries"],
  transport: ["Taxi", "Bus"],
  activities: ["Museum", "Day tour"],
  shopping: ["Souvenirs"],
  stay: "Accommodation",
};

/** A small seeded generator, so the demo shows the same expenses after every deploy. */
function generator(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedDemo(client) {
  const { rows } = await client.query(
    "select (select count(*) from legs)::int as legs, (select count(*) from expenses)::int as expenses",
  );
  if (rows[0].legs > 0 || rows[0].expenses > 0) {
    console.log("[demo] The database already has data, so the sample trip was not added.");
    return;
  }

  const sample = JSON.parse(await readFile(new URL("../lib/sample-trip.json", import.meta.url), "utf8"));
  const today = toDay(new Date().toISOString().slice(0, 10));
  const shift = today - DAYS_INTO_TRIP - toDay(sample[0].startDate);
  const random = generator(20261201);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const between = (min, max) => min + random() * (max - min);

  const expenses = [];
  const add = (day, order, currency, euro, category, note, legId) => {
    const rate = currency === "EUR" ? 1 : RATES[currency];
    const step = STEP[currency] ?? 0.01;
    const amount = currency === "EUR" ? Math.round(euro * 100) / 100 : Math.max(step, Math.round((euro * rate) / step) * step);
    expenses.push({
      date: fromDay(day),
      amount: amount.toFixed(2),
      currency,
      category,
      note,
      legId,
      rate: rate.toFixed(8),
      amountEur: (Math.round((amount / rate) * 100) / 100).toFixed(2),
      // Spread over the day so the list of recent expenses reads in a natural order.
      createdAt: new Date(day * DAY + (8 + order * 3) * 3_600_000).toISOString(),
    });
  };

  await client.query("begin");
  try {
    // Bookings made before the trip are not tied to a leg.
    add(today - DAYS_INTO_TRIP - 21, 0, "EUR", 612.4, "flights", "Bucharest to Chiang Mai", null);
    add(today - DAYS_INTO_TRIP - 14, 0, "EUR", 389, "visas", "Travel insurance for nine months", null);

    let previousCountry = "";
    for (const leg of sample) {
      const start = toDay(leg.startDate) + shift;
      const end = toDay(leg.endDate) + shift;
      const inserted = await client.query(
        "insert into legs (country, flag, cities, start_date, end_date, currency) values ($1, $2, $3, $4, $5, $6) returning id",
        [leg.country, leg.flag, leg.cities, fromDay(start), fromDay(end), leg.currency],
      );
      const legId = inserted.rows[0].id;
      const notes = NOTES[leg.country] ?? FALLBACK;
      // Japan costs about twice as much a day as Thailand or Vietnam.
      const level = leg.country === "Japan" ? 2.1 : 1;

      for (let day = start; day <= Math.min(end, today); day++) {
        const dayOfLeg = day - start;
        let order = 0;
        if (dayOfLeg === 0 && leg.country !== previousCountry && previousCountry) {
          add(day, order++, "EUR", between(95, 240), "flights", `Flight to ${leg.cities.split(" / ")[0]}`, legId);
          if (leg.country === "Vietnam") add(day, order++, "USD", 23.15, "visas", "Vietnam visa", legId);
        }
        if (leg.country === "Thailand" ? dayOfLeg === 0 : dayOfLeg % (leg.country === "Japan" ? 4 : 7) === 0) {
          const stay = leg.country === "Thailand" ? 470 : leg.country === "Japan" ? between(290, 380) : between(150, 190);
          add(day, order++, leg.currency, stay, "accommodation", notes.stay, legId);
        }
        const meals = 1 + Math.floor(random() * 3);
        for (let i = 0; i < meals; i++) {
          add(day, order++, leg.currency, between(2.2, 11) * level, "food", pick(notes.food), legId);
        }
        if (random() < 0.55) add(day, order++, leg.currency, between(1.5, 7) * level, "transport", pick(notes.transport), legId);
        if (random() < 0.16) add(day, order++, leg.currency, between(9, 38) * level, "activities", pick(notes.activities), legId);
        if (random() < 0.07) add(day, order++, leg.currency, between(8, 45) * level, "shopping", pick(notes.shopping), legId);
        if (random() < 0.02) add(day, order++, leg.currency, between(6, 30), "health", "Pharmacy", legId);
      }
      previousCountry = leg.country;
    }

    for (const e of expenses) {
      await client.query(
        "insert into expenses (date, amount, currency, category, note, leg_id, rate, amount_eur, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [e.date, e.amount, e.currency, e.category, e.note, e.legId, e.rate, e.amountEur, e.createdAt],
      );
    }
    await client.query(
      "insert into settings (id, name, setup_done_at) values (1, '', now()) on conflict (id) do update set setup_done_at = now()",
    );
    await client.query("commit");
    console.log(`[demo] Added the sample trip with ${expenses.length} expenses.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
