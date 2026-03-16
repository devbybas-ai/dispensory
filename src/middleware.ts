import NextAuth from "next-auth";
import { authConfig, isStorefrontRoute } from "@/auth.config";
import { NextResponse } from "next/server";

const AGE_COOKIE_NAME = "age_verified";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // === Age gate check for storefront routes ===
  if (isStorefrontRoute(pathname) && !pathname.startsWith("/age-verify")) {
    const ageCookie = request.cookies.get(AGE_COOKIE_NAME);
    if (!ageCookie?.value) {
      const ageUrl = new URL("/age-verify", request.nextUrl.origin);
      ageUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(ageUrl);
    }
  }

  // === Security headers ===
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${process.env.S3_ENDPOINT || ""} ${process.env.S3_BUCKET ? `https://${process.env.S3_BUCKET}.s3.amazonaws.com` : ""}`.trim(),
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // === CSRF ===
  const method = request.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse("Forbidden: Origin mismatch", { status: 403 });
        }
      } catch {
        return new NextResponse("Forbidden: Invalid origin", { status: 403 });
      }
    }
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
