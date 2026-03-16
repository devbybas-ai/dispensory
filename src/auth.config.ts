import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

// Edge-safe auth config (no Node.js-only dependencies)
// Used by middleware for JWT session verification + route protection

const publicRoutes = ["/login", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export const authConfig = {
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours (covers a shift)
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Credentials provider added in auth.ts (Node.js only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      if (!isPublicRoute(nextUrl.pathname) && !isLoggedIn) {
        return false; // Redirects to pages.signIn
      }

      // Redirect logged-in users away from login page
      if (nextUrl.pathname.startsWith("/login") && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
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
