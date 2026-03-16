"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { CustomerType } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Customer Verification
// Age gate: 21+ adult-use, 18+ medicinal with recommendation
// ─────────────────────────────────────────────────────────────

const ADULT_USE_MIN_AGE = 21;
const MEDICINAL_MIN_AGE = 18;

/** Calculate age from date of birth. */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

interface VerifyCustomerResult {
  eligible: boolean;
  reason?: string;
}

/** Verify a customer is eligible to purchase based on age and type. */
export async function verifyCustomerEligibility(
  dateOfBirth: Date,
  type: CustomerType,
  hasValidRecommendation: boolean = false
): Promise<VerifyCustomerResult> {
  const age = calculateAge(dateOfBirth);

  if (type === "ADULT_USE") {
    if (age < ADULT_USE_MIN_AGE) {
      return {
        eligible: false,
        reason: `Customer must be ${ADULT_USE_MIN_AGE}+ for adult-use. Age: ${age}`,
      };
    }
  }

  if (type === "MEDICINAL") {
    if (age < MEDICINAL_MIN_AGE) {
      return {
        eligible: false,
        reason: `Customer must be ${MEDICINAL_MIN_AGE}+ for medicinal. Age: ${age}`,
      };
    }
    if (!hasValidRecommendation) {
      return {
        eligible: false,
        reason: "Valid medical recommendation required for medicinal purchases.",
      };
    }
  }

  return { eligible: true };
}

interface CreateCustomerInput {
  type: CustomerType;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phone?: string;
  email?: string;
  idType?: string;
  idExpiration?: Date;
}

export async function createCustomer(input: CreateCustomerInput) {
  const session = await requirePermission("pos:sell");

  // Age verification on creation
  const eligibility = await verifyCustomerEligibility(input.dateOfBirth, input.type);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  const customer = await db.customer.create({
    data: {
      type: input.type,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      phone: input.phone,
      email: input.email,
      idType: input.idType,
      idExpiration: input.idExpiration,
      idVerified: !!input.idType,
      idVerifiedAt: input.idType ? new Date() : undefined,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "Customer",
    entityId: customer.id,
    // Do NOT log PII in audit events
    metadata: { type: input.type, idVerified: customer.idVerified },
  });

  return customer;
}

export async function getCustomerById(id: string) {
  await requirePermission("pos:read");

  return db.customer.findUniqueOrThrow({
    where: { id },
    include: { patientRecord: true },
  });
}

export async function searchCustomers(query: string) {
  await requirePermission("pos:read");

  return db.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { lastName: "asc" },
  });
}
