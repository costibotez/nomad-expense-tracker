import { Suspense } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { Nav } from "@/components/nav";
import { DEMO_MODE } from "@/lib/demo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {DEMO_MODE && (
        <Suspense>
          <DemoBanner />
        </Suspense>
      )}
      <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+112px)]">
        {children}
      </main>
      <Suspense>
        <Nav />
      </Suspense>
    </>
  );
}
