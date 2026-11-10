"use client";

import { useState } from "react";
import { revokeShareLink } from "@/app/actions";
import { ConfirmButton } from "./confirm-button";

export function ShareLinkRow({ id, token, created }: { id: number; token: string; created: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/share/${token}`;

  async function copy() {
    const url = window.location.origin + path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The clipboard can be blocked, so fall back to showing the link.
      window.prompt("Copy this link", url);
    }
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <a href={path} target="_blank" rel="noreferrer" className="min-w-0 truncate text-ink underline">
          {path}
        </a>
        <span className="shrink-0 text-xs text-muted">Created {created}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copy}
          className="min-h-11 rounded-full bg-accent text-sm font-semibold text-accent-ink"
        >
          <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
        </button>
        <form action={revokeShareLink}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton
            message="Switch this link off? Anyone who has it will lose access."
            className="min-h-11 w-full rounded-full border border-line text-sm font-medium text-danger"
          >
            Switch off
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
