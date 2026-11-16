"use client";

import { useSearchParams } from "next/navigation";
import { FAMILY_URL } from "@/lib/brand";

/** The strip at the top of every screen of the live demo. */
export function DemoBanner() {
  const blocked = useSearchParams().get("demo") === "blocked";
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 bg-hero px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 text-xs text-hero-muted"
    >
      <p className="min-w-0">
        {blocked ? (
          <strong className="font-semibold text-hero-ink">Nothing was changed. This is a live demo.</strong>
        ) : (
          "Live demo. Nothing is saved."
        )}
      </p>
      <a
        href={FAMILY_URL}
        className="flex min-h-9 shrink-0 items-center font-semibold text-hero-ink underline underline-offset-4"
      >
        Deploy your own
      </a>
    </div>
  );
}
