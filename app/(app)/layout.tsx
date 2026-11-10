import { Suspense } from "react";
import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-28">{children}</main>
      <Suspense>
        <Nav />
      </Suspense>
    </>
  );
}
