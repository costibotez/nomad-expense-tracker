"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const NOTICE_KEY = "nomad-cookie-notice-v1";

let override: boolean | undefined;
function subscribe(callback: () => void) {
  window.addEventListener("nomad:cookie-notice", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("nomad:cookie-notice", callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  if (override !== undefined) return override;
  try { return !localStorage.getItem(NOTICE_KEY); } catch { return true; }
}

export function CookieNotice() {
  const visible = useSyncExternalStore(subscribe, snapshot, () => false);
  function dismiss() {
    try { localStorage.setItem(NOTICE_KEY, "acknowledged"); } catch { /* Remember for this page only. */ }
    override = false;
    window.dispatchEvent(new Event("nomad:cookie-notice"));
  }

  if (!visible) return null;
  return (
    <aside className="cookie-notice" aria-label="Cookie information">
      <div><strong>A little note about cookies</strong><p>We use essential storage to keep the tracker secure and remember this notice. This site does not currently use analytics or advertising cookies. <Link href="/legal/cookies">Cookie policy</Link></p></div>
      <button type="button" onClick={dismiss}>Got it</button>
    </aside>
  );
}

export function CookiePreferences() {
  return <button type="button" className="cookie-preferences" onClick={() => { override = true; window.dispatchEvent(new Event("nomad:cookie-notice")); }}>Cookie preferences</button>;
}
