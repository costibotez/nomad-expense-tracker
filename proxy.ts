import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";
import { routes } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The live demo has no password. Its server actions refuse every change.
  // That also lets the demo guide's /api/demo-agent routes through; they 404
  // on their own unless the guide is switched on (lib/demo.ts DEMO_AGENT).
  const signedIn = DEMO_MODE || isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (pathname === routes.login) {
    return signedIn ? NextResponse.redirect(new URL(routes.app, request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL(routes.login, request.url));
}

export const config = { matcher: ["/app/:path*", "/api/:path*"] };
