import { FamilyMark } from "@/components/family-mark";

export const metadata = { robots: { index: false, follow: false } };

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+40px)]">
      {children}
      <footer className="mt-8 flex justify-center">
        <FamilyMark text="Made with Nomad Expenses by NomadWealth" link className="min-h-11 text-muted" />
      </footer>
    </main>
  );
}
