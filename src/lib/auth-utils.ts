import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import type { Session } from "next-auth";

// ─────────────────────────────────────────────────────────────
// Permission map: role → allowed permissions
// ─────────────────────────────────────────────────────────────

export type Permission =
  | "compliance:read"
  | "compliance:write"
  | "inventory:read"
  | "inventory:write"
  | "inventory:receive"
  | "pos:read"
  | "pos:sell"
  | "pos:void"
  | "pos:return"
  | "delivery:read"
  | "delivery:manage"
  | "users:read"
  | "users:write"
  | "audit:read"
  | "finance:read"
  | "finance:write";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    "compliance:read",
    "compliance:write",
    "inventory:read",
    "inventory:write",
    "inventory:receive",
    "pos:read",
    "pos:sell",
    "pos:void",
    "pos:return",
    "delivery:read",
    "delivery:manage",
    "users:read",
    "users:write",
    "audit:read",
    "finance:read",
    "finance:write",
  ],
  MANAGER: [
    "compliance:read",
    "compliance:write",
    "inventory:read",
    "inventory:write",
    "inventory:receive",
    "pos:read",
    "pos:sell",
    "pos:void",
    "pos:return",
    "delivery:read",
    "delivery:manage",
    "users:read",
    "audit:read",
    "finance:read",
  ],
  CASHIER: ["inventory:read", "pos:read", "pos:sell"],
  RECEIVER: ["inventory:read", "inventory:write", "inventory:receive"],
  DISPATCHER: ["delivery:read", "delivery:manage", "pos:read"],
  SECURITY: ["compliance:read", "audit:read"],
} as const;

// ─────────────────────────────────────────────────────────────
// Session helpers (server components + server actions)
// ─────────────────────────────────────────────────────────────

/** Get the current session or redirect to login. */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/** Get the current session or return null. */
export async function getSession(): Promise<Session | null> {
  return await auth();
}

// ─────────────────────────────────────────────────────────────
// Role & permission checks
// ─────────────────────────────────────────────────────────────

/** Check if a session has a specific role. */
export function hasRole(session: Session, roles: Role[]): boolean {
  return roles.includes(session.user.role);
}

/** Check if a session has a specific permission. */
export function hasPermission(session: Session, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[session.user.role];
  return permissions.includes(permission);
}

/** Require a specific role or redirect to unauthorized. */
export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await requireAuth();
  if (!hasRole(session, roles)) {
    redirect("/unauthorized");
  }
  return session;
}

/** Require a specific permission or redirect to unauthorized. */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireAuth();
  if (!hasPermission(session, permission)) {
    redirect("/unauthorized");
  }
  return session;
}

/** Get all permissions for a role. */
export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
