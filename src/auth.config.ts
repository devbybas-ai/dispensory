import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

const publicRoutes = ["/login", "/api/auth", "/age-verify", "/shop", "/api/shop"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

function isStorefrontRoute(pathname: string): boolean {
  return pathname.startsWith("/shop") || pathname.startsWith("/age-verify");
}

function isCustomerAccountRoute(pathname: string): boolean {
  return pathname.startsWith("/shop/account");
}

export { isStorefrontRoute, isCustomerAccountRoute };

export const authConfig = {
  session: { strategy: "jwt" as const, maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Root redirects to /shop (handled by page.tsx)
      if (pathname === "/") {
        return true;
      }

      // Public storefront routes — no auth required
      if (isStorefrontRoute(pathname) && !isCustomerAccountRoute(pathname)) {
        return true;
      }

      // Other public routes
      if (isPublicRoute(pathname) && !isLoggedIn) {
        return true;
      }

      // Staff routes — require auth
      if (!isPublicRoute(pathname) && !isLoggedIn) {
        return false;
      }

      // Redirect logged-in users away from login page
      if (pathname.startsWith("/login") && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.premisesId = user.premisesId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.premisesId = token.premisesId as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
