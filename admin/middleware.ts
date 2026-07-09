import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/bookings",
  "/tours",
  "/blogs",
  "/inquiries",
  "/customers",
  "/finance",
  "/reports",
  "/navigation",
  "/alert-popup",
  "/settings",
  "/users"
];

function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(paddedPayload)) as { exp?: number; sub?: string; role?: string };
  } catch {
    return null;
  }
}

function isValidSession(token: string | undefined) {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.role) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return false;

  return true;
}

function redirectWithClearedSession(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete("mhn_admin_session");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("mhn_admin_session")?.value;
  const hasSession = isValidSession(sessionToken);
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (sessionToken && !hasSession) {
    if (isProtected || pathname === "/") {
      return redirectWithClearedSession(request, "/login");
    }

    const response = NextResponse.next();
    response.cookies.delete("mhn_admin_session");
    return response;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/bookings/:path*", "/tours/:path*", "/blogs/:path*", "/inquiries/:path*", "/customers/:path*", "/finance/:path*", "/reports/:path*", "/navigation/:path*", "/alert-popup/:path*", "/settings/:path*", "/users/:path*"]
};
