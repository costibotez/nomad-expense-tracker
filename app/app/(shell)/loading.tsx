export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="-mx-4 h-56 rounded-b-[32px] bg-hero" />
      <div className="card h-28" />
      <div className="card h-48" />
    </div>
  );
}
