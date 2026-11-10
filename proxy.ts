import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { routes } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
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
