"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";

// ─────────────────────────────────────────────────────────────
// Local Rules Engine
// Per-city/per-county configurable rules
// ─────────────────────────────────────────────────────────────

interface UpsertLocalRuleInput {
  premisesId: string;
  jurisdiction: string;
  ruleKey: string;
  ruleValue: string;
  description?: string;
  effectiveAt?: Date;
  expiresAt?: Date;
}

/** Create or update a local rule (upsert on premisesId + ruleKey). */
export async function upsertLocalRule(input: UpsertLocalRuleInput) {
  const session = await requirePermission("compliance:write");

  const existing = await db.localRule.findUnique({
    where: {
      premisesId_ruleKey: {
        premisesId: input.premisesId,
        ruleKey: input.ruleKey,
      },
    },
  });

  const rule = await db.localRule.upsert({
    where: {
      premisesId_ruleKey: {
        premisesId: input.premisesId,
        ruleKey: input.ruleKey,
      },
    },
    create: {
      premisesId: input.premisesId,
      jurisdiction: input.jurisdiction,
      ruleKey: input.ruleKey,
      ruleValue: input.ruleValue,
      description: input.description,
      effectiveAt: input.effectiveAt ?? new Date(),
      expiresAt: input.expiresAt,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
    update: {
      jurisdiction: input.jurisdiction,
      ruleValue: input.ruleValue,
      description: input.description,
      effectiveAt: input.effectiveAt,
      expiresAt: input.expiresAt,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: existing ? "update" : "create",
    entity: "LocalRule",
    entityId: rule.id,
    before: existing,
    after: rule,
    premisesId: input.premisesId,
  });

  return rule;
}

export async function getLocalRules(premisesId: string) {
  await requirePermission("compliance:read");

  return db.localRule.findMany({
    where: {
      premisesId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { ruleKey: "asc" },
  });
}

/** Get a specific rule value, with a default fallback. */
export async function getLocalRuleValue(
  premisesId: string,
  ruleKey: string,
  defaultValue: string
): Promise<string> {
  const rule = await db.localRule.findUnique({
    where: {
      premisesId_ruleKey: { premisesId, ruleKey },
    },
  });

  if (!rule || (rule.expiresAt && rule.expiresAt < new Date())) {
    return defaultValue;
  }

  return rule.ruleValue;
}

