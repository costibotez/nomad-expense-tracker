export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="h-8 w-40 rounded-lg bg-track" />
      <div className="card h-28" />
      <div className="card h-48" />
    </div>
  );
}
