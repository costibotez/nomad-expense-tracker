import { routes } from "@/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { finishSetup, loadSampleTrip, saveSetupName } from "@/app/actions";
import { LegForm } from "@/components/leg-form";
import { TripCard } from "@/components/ui";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from "@/lib/places";
import { getLegs, getSettings, serverToday } from "@/lib/queries";

export const metadata: Metadata = { title: "Set up Nomad Expenses" };

const STEPS = ["name", "trip", "done"] as const;
type Step = (typeof STEPS)[number];

const primaryButton = "flex min-h-14 w-full items-center justify-center rounded-full bg-white font-semibold text-[#0a0a0a]";
const skipLink = "flex min-h-11 items-center justify-center text-sm text-hero-muted underline underline-offset-4";

/** The first run walkthrough: your name, your first trip leg, then into the app. Every step can be skipped. */
export default async function SetupPage({ searchParams }: PageProps<"/app/setup">) {
  const params = await searchParams;
  const [settings, legs] = await Promise.all([getSettings(), getLegs()]);
  if (settings?.setupDoneAt) redirect(routes.app);

  const step: Step = STEPS.find((s) => s === params.step) ?? "name";
  const position = STEPS.indexOf(step);
  const name = settings?.name ?? "";

  const addDays = (iso: string, n: number) =>
    new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const today = serverToday();

  return (
    <main className="min-h-dvh bg-hero text-hero-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-7 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.18em] text-hero-muted uppercase">
            Step {position + 1} of {STEPS.length}
          </p>
          <ol aria-hidden className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s} className={`h-1.5 rounded-full ${i === position ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
            ))}
          </ol>
        </div>

        {step === "name" && (
          <div className="hero flex flex-1 flex-col justify-center gap-8">
            <TripCard
              label="Nomad Expenses"
              name="Your trip starts here"
              mark="EUR"
              markCaption="Every currency, one total"
              stacked
            />
            <div>
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Welcome</h1>
              <p className="mt-1 text-hero-muted">
                Two quick steps and you are ready to track a trip. First, what should the app call you?
              </p>
            </div>
            <form action={saveSetupName} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Your name
                <input
                  className="field field-dark"
                  name="name"
                  defaultValue={name}
                  maxLength={40}
                  autoComplete="given-name"
                  placeholder="First name"
                />
              </label>
              <button type="submit" className={primaryButton}>
                Continue
              </button>
              <Link href={`${routes.setup}?step=trip`} className={skipLink}>
                Skip this step
              </Link>
            </form>
          </div>
        )}

        {step === "trip" && (
          <div className="flex flex-1 flex-col gap-5">
            <div className="hero">
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
                {name ? `Nice to meet you, ${name}` : "Your first trip"}
              </h1>
              <p className="mt-1 text-hero-muted">
                A trip is a list of legs, one for each country and set of dates. Add the first leg now. The
                rest can follow later on the Trip screen.
              </p>
            </div>
            <div className="card text-ink">
              <LegForm
                countries={COUNTRY_OPTIONS}
                currencies={CURRENCY_OPTIONS}
                defaults={{ startDate: today, endDate: addDays(today, 6) }}
                setup
              />
            </div>
            <div className="hero flex flex-col gap-1">
              {legs.length === 0 && (
                <form action={loadSampleTrip}>
                  <button
                    type="submit"
                    className="min-h-12 w-full rounded-full border border-white/25 text-sm font-medium"
                  >
                    Look around with a sample trip
                  </button>
                </form>
              )}
              <Link href={`${routes.setup}?step=done`} className={skipLink}>
                Skip this step
              </Link>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="hero flex flex-1 flex-col justify-center gap-8">
            <TripCard
              label={legs[0] ? `${legs[0].flag} ${legs[0].country}` : "Nomad Expenses"}
              name={legs[0]?.cities || "Your trip starts here"}
              mark={legs[0]?.currency ?? "EUR"}
              markCaption="Every currency, one total"
              stacked
            />
            <div>
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
                {name ? `You are all set, ${name}` : "You are all set"}
              </h1>
              <p className="mt-1 text-hero-muted">
                {legs.length === 0
                  ? "No trip yet. You can add legs on the Trip screen whenever you are ready, and expenses work without one."
                  : legs.length === 1
                    ? "Your first leg is saved. Add more legs on the Trip screen, then start adding expenses."
                    : `${legs.length} legs are saved. Change them on the Trip screen, then start adding expenses.`}
              </p>
            </div>
            <form action={finishSetup} className="flex flex-col gap-3">
              <button type="submit" className={primaryButton}>
                Open the app
              </button>
              <Link href={`${routes.setup}?step=trip`} className={skipLink}>
                Back
              </Link>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
