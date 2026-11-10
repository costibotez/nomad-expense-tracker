import { LoginForm } from "@/components/login-form";
import { TripCard } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="hero min-h-dvh bg-hero text-hero-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-10">
        <TripCard
          label="Nomad Expenses"
          name="Chiang Mai to Almaty"
          mark="EUR"
          markCaption="Every currency, one total"
          stacked
        />
        <div>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-hero-muted">Enter your password to continue.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
