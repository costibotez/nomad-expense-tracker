import Link from "next/link";
import { CookieNotice, CookiePreferences } from "@/components/cookie-notice";

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="landing legal-site">
    <header className="legal-header"><Link href="/" className="legal-brand">✳ &nbsp; NOMAD EXPENSES</Link><Link href="/">← Back to home</Link></header>
    <main className="legal-main"><p className="eyebrow">NOMAD EXPENSES / INFORMATION</p><h1>{title}</h1><p className="legal-updated">Last updated: 10 November 2026</p><div className="legal-content">{children}</div></main>
    <footer className="landing-footer"><span>✳ &nbsp; NOMAD EXPENSES</span><div className="footer-links"><Link href="/legal/privacy">Privacy</Link><Link href="/legal/cookies">Cookies</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/refunds">Refunds</Link><Link href="/legal/license">Licence</Link><Link href="/security">Security</Link><a href="mailto:contact@nomad-developer.co.uk">Contact</a><CookiePreferences /></div><span>Made by <a href="https://www.nomad-developer.co.uk/">Nomad Developer</a></span></footer>
    <CookieNotice />
  </div>;
}
