"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          className="field field-dark"
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-[#ff8a89]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-14 rounded-full bg-white font-semibold text-[#0a0a0a] disabled:opacity-60"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
