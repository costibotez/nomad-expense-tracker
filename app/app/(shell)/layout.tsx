import { Suspense } from "react";
import { BotIdClient } from "botid/client";
import { DemoAgent } from "@/components/demo-agent";
import { DemoBanner } from "@/components/demo-banner";
import { Nav } from "@/components/nav";
import { DEMO_AGENT, DEMO_MODE } from "@/lib/demo";
import { DEMO_AGENT_PROTECTED_ROUTES } from "@/lib/demo-agent/pages";

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
      {/* AI demo guide (lib/demo-agent): the live demo only, never a personal install. */}
      {DEMO_AGENT && (
        <>
          {/* Tags the guide's requests with a BotID challenge token. */}
          <BotIdClient protect={DEMO_AGENT_PROTECTED_ROUTES} />
          <Suspense>
            <DemoAgent />
          </Suspense>
        </>
      )}
    </>
  );
}
