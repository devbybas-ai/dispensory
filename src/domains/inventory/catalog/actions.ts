"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { ProductCategory, ComplianceStatus } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Product Catalog
// Compliance metadata: cannabinoid content, batch, UID, test status
// ─────────────────────────────────────────────────────────────

interface CreateProductInput {
  vendorId?: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  description?: string;
  sku?: string;
  requiresLabTest?: boolean;
  isForAdultUse?: boolean;
  isForMedicinal?: boolean;
  unitPrice?: number;
  costPrice?: number;
  unitWeight?: number;
  unitOfMeasure?: string;
}

export async function createProduct(input: CreateProductInput) {
  const session = await requirePermission("inventory:write");

  const product = await db.productMaster.create({
    data: {
      vendorId: input.vendorId,
      name: input.name,
      brand: input.brand,
      category: input.category,
      description: input.description,
      sku: input.sku,
      complianceStatus: "DRAFT",
      requiresLabTest: input.requiresLabTest ?? true,
      isForAdultUse: input.isForAdultUse ?? true,
      isForMedicinal: input.isForMedicinal ?? false,
      unitPrice: input.unitPrice ? input.unitPrice : undefined,
      costPrice: input.costPrice ? input.costPrice : undefined,
      unitWeight: input.unitWeight ? input.unitWeight : undefined,
      unitOfMeasure: input.unitOfMeasure ?? "each",
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "ProductMaster",
    entityId: product.id,
    after: product,
  });

  return product;
}

interface UpdateProductInput {
  id: string;
  name?: string;
  brand?: string;
  category?: ProductCategory;
  description?: string;
  sku?: string;
  unitPrice?: number;
  costPrice?: number;
  unitWeight?: number;
  unitOfMeasure?: string;
  isForAdultUse?: boolean;
  isForMedicinal?: boolean;
}

export async function updateProduct(input: UpdateProductInput) {
  const session = await requirePermission("inventory:write");

  const before = await db.productMaster.findUniqueOrThrow({
    where: { id: input.id },
  });

  const product = await db.productMaster.update({
    where: { id: input.id },
    data: {
      name: input.name,
      brand: input.brand,
      category: input.category,
      description: input.description,
      sku: input.sku,
      unitPrice: input.unitPrice !== undefined ? input.unitPrice : undefined,
      costPrice: input.costPrice !== undefined ? input.costPrice : undefined,
      unitWeight: input.unitWeight !== undefined ? input.unitWeight : undefined,
      unitOfMeasure: input.unitOfMeasure,
      isForAdultUse: input.isForAdultUse,
      isForMedicinal: input.isForMedicinal,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "ProductMaster",
    entityId: product.id,
    before,
    after: product,
  });

  return product;
}

/** Transition compliance review status with audit trail. */
export async function updateComplianceStatus(productId: string, newStatus: ComplianceStatus) {
  const session = await requirePermission("compliance:write");

  const before = await db.productMaster.findUniqueOrThrow({
    where: { id: productId },
  });

  const product = await db.productMaster.update({
    where: { id: productId },
    data: {
      complianceStatus: newStatus,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "state_change",
    entity: "ProductMaster",
    entityId: product.id,
    before: { complianceStatus: before.complianceStatus },
    after: { complianceStatus: newStatus },
    metadata: { transition: `${before.complianceStatus} → ${newStatus}` },
  });

  return product;
}

export async function getProducts(filters?: {
  category?: ProductCategory;
  complianceStatus?: ComplianceStatus;
  vendorId?: string;
  search?: string;
}) {
  await requirePermission("inventory:read");

  return db.productMaster.findMany({
    where: {
      deletedAt: null,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.complianceStatus && {
        complianceStatus: filters.complianceStatus,
      }),
      ...(filters?.vendorId && { vendorId: filters.vendorId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { brand: { contains: filters.search, mode: "insensitive" as const } },
          { sku: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    },
    include: { vendor: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id: string) {
  await requirePermission("inventory:read");

  return db.productMaster.findUniqueOrThrow({
    where: { id },
    include: {
      vendor: true,
      batches: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
