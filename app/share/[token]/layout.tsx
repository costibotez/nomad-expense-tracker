export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+40px)]">
      {children}
    </main>
  );
}
