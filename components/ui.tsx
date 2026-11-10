import Link from "next/link";
import { Nfc } from "lucide-react";

/** The black panel at the top of every screen. */
export function Hero({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="hero -mx-4 rounded-b-[32px] bg-hero px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-6 text-hero-ink">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-hero-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </header>
  );
}

/** A small round button for the top right corner of the black panel. */
export function HeroButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hero-field text-hero-ink"
    >
      {children}
    </Link>
  );
}

/** A round outlined icon with a caption, like the actions under a bank card. */
export function RoundAction({
  href,
  label,
  icon,
  download,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  download?: boolean;
}) {
  const content = (
    <>
      <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-ink">
        {icon}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </>
  );
  const className = "flex flex-col items-center gap-2";
  return download ? (
    <a href={href} className={className} download>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** The silver card. `mark` sits where a card network logo would be. */
export function TripCard({
  label,
  name,
  mark,
  markCaption,
  stacked = false,
}: {
  label: string;
  name: string;
  mark: string;
  markCaption: string;
  stacked?: boolean;
}) {
  const card = (
    <div className="trip-card flex aspect-[1.586] flex-col justify-between p-5">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase">{label}</span>
        <Nfc size={26} strokeWidth={1.5} aria-hidden />
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium">{name}</span>
        <span className="shrink-0 text-right leading-none">
          <span className="block text-[34px] font-black tracking-tight italic">{mark}</span>
          <span className="mt-1 block text-[10px] opacity-60">{markCaption}</span>
        </span>
      </div>
    </div>
  );
  return stacked ? <div className="trip-card-stack">{card}</div> : card;
}

/** Section card with a heading row. */
export function Panel({
  title,
  aside,
  children,
  id,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section className="card p-5" aria-labelledby={id}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {aside && <span className="tabular text-sm text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
