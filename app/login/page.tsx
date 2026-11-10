import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Nomad Expenses</h1>
        <p className="mt-1 text-muted">Enter your password to continue.</p>
      </div>
      <LoginForm />
    </main>
  );
}
