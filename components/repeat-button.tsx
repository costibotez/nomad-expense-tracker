"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Repeat } from "lucide-react";
import { repeatExpense } from "@/app/actions";

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function Button({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className="mr-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
    >
      <Repeat size={18} className={pending ? "animate-spin" : undefined} aria-hidden />
    </button>
  );
}

/** One tap adds the same expense again, dated today. */
export function RepeatButton({ id, label }: { id: number; label: string }) {
  const date = useRef<HTMLInputElement>(null);
  return (
    <form
      action={repeatExpense}
      // The phone knows the local calendar date, the server only knows its own.
      onSubmit={() => {
        if (date.current) date.current.value = localToday();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input ref={date} type="hidden" name="date" defaultValue="" />
      <Button label={label} />
    </form>
  );
}
