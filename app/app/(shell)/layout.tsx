import { Suspense } from "react";
import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+112px)]">
        {children}
      </main>
      <Suspense>
        <Nav />
      </Suspense>
    </>
  );
}
