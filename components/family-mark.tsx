import { FAMILY_NAME, FAMILY_URL } from "@/lib/brand";

/**
 * The NomadWealth mark with a short line of text. As a link it is a plain
 * link: no tracking and no referrer, so the other site learns nothing.
 */
export function FamilyMark({
  text = `by ${FAMILY_NAME}`,
  link = false,
  className = "",
}: {
  text?: string;
  link?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/nomadwealth-mark.png" alt="" width={16} height={16} className="size-4 shrink-0" />
      <span>{text}</span>
    </>
  );
  const classes = `inline-flex items-center gap-1.5 text-xs font-medium ${className}`;
  return link ? (
    <a href={FAMILY_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={classes}>
      {content}
    </a>
  ) : (
    <span className={classes}>{content}</span>
  );
}
