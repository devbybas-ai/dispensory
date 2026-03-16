import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────
// Enum definitions (spelled out to avoid edge-runtime issues
// with Prisma client imports in validation layers)
// ─────────────────────────────────────────────────────────────

export const LicenseTypeEnum = z.enum([
  "ADULT_USE_RETAIL",
  "MEDICINAL_RETAIL",
  "ADULT_USE_DELIVERY",
  "MEDICINAL_DELIVERY",
  "DISTRIBUTOR",
  "MANUFACTURER",
  "CULTIVATOR",
  "TESTING_LAB",
  "MICROBUSINESS",
]);

export const LicenseStatusEnum = z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"]);

export const DocumentTypeEnum = z.enum([
  "LICENSE",
  "PERMIT",
  "COA",
  "MANIFEST",
  "RECEIPT",
  "ID_SCAN",
  "PHOTO",
  "OTHER",
]);

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

/** CUID identifier used for all entity IDs and route params. */
const cuidSchema = z.string().min(1, "ID is required");

/** Premises ID - always required for scoping to a location. */
const premisesIdSchema = z.string().min(1, "Premises ID is required");

/**
 * Coerce strings/numbers into Date objects.
 * Accepts ISO-8601 strings, timestamps, and Date instances.
 */
const dateCoerce = z.coerce.date();

/**
 * DCC license numbers follow a pattern like C10-0000001-LIC.
 * We validate the general shape without being so strict that
 * legitimate edge cases are rejected.
 */
const licenseNumberSchema = z
  .string()
  .trim()
  .min(1, "License number is required")
  .max(50, "License number must be 50 characters or fewer");

/** Permit numbers vary by jurisdiction; keep it flexible. */
const permitNumberSchema = z
  .string()
  .trim()
  .min(1, "Permit number is required")
  .max(100, "Permit number must be 100 characters or fewer");

/**
 * Warning-days threshold: how many days before expiration to
 * raise alerts. Must be a positive integer with a sane upper bound.
 */
const warningDaysSchema = z
  .number()
  .int("Warning days must be a whole number")
  .min(1, "Warning days must be at least 1")
  .max(730, "Warning days cannot exceed 730 (2 years)");

/**
 * Refinement helper: ensures at least one field besides `id` is
 * present in an update payload. Used by all Update* schemas.
 */
function hasUpdateFields(data: Record<string, unknown>): boolean {
  return Object.entries(data).some(([key, value]) => key !== "id" && value !== undefined);
}

const UPDATE_REFINEMENT_MSG = "At least one field must be provided for update";

// ─────────────────────────────────────────────────────────────
// Route & Query Params
// ─────────────────────────────────────────────────────────────

/** Validate a single ID from route params (e.g., /licenses/[id]). */
export const IdParamSchema = z.strictObject({
  id: cuidSchema,
});

/** Validate a premises-scoped ID pair (e.g., /premises/[premisesId]/licenses/[id]). */
export const PremisesIdParamSchema = z.strictObject({
  premisesId: premisesIdSchema,
  id: cuidSchema,
});

/**
 * Query schema for license expiration lookups.
 * Used by dashboard widgets and alert endpoints.
 */
export const LicenseExpirationQuerySchema = z.strictObject({
  premisesId: premisesIdSchema,
  /** Number of days from now to check for upcoming expirations. */
  withinDays: z.coerce
    .number()
    .int("withinDays must be a whole number")
    .min(1, "withinDays must be at least 1")
    .max(730, "withinDays cannot exceed 730")
    .default(90),
});

/** Generic list query with optional pagination for compliance entities. */
export const ComplianceListQuerySchema = z.strictObject({
  premisesId: premisesIdSchema,
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(25).optional(),
  status: LicenseStatusEnum.optional(),
});

// ─────────────────────────────────────────────────────────────
// 1. Licensing Schemas
//    DCC licenses, seller's permits, cannabis tax permits,
//    surety bonds
// ─────────────────────────────────────────────────────────────

export const CreateLicenseSchema = z.strictObject({
  premisesId: premisesIdSchema,

  licenseType: LicenseTypeEnum,
  licenseNumber: licenseNumberSchema,
  status: LicenseStatusEnum.default("PENDING"),

  /** Issuing authority (e.g., "DCC", "CDTFA", bonding company). */
  issuedBy: z
    .string()
    .trim()
    .min(1, "Issuing authority is required")
    .max(200, "Issuing authority must be 200 characters or fewer"),

  /** Date the license was issued. Null if still pending. */
  issuedAt: dateCoerce.optional(),

  /** Expiration date -- always required for compliance tracking. */
  expiresAt: dateCoerce,

  /** Days before expiry to trigger warnings. Defaults to 90. */
  warningDays: warningDaysSchema.default(90),
});

export const UpdateLicenseSchema = z
  .strictObject({
    id: cuidSchema,
    status: LicenseStatusEnum.optional(),
    licenseNumber: licenseNumberSchema.optional(),
    issuedBy: z.string().trim().min(1).max(200).optional(),
    issuedAt: dateCoerce.optional(),
    expiresAt: dateCoerce.optional(),
    renewedAt: dateCoerce.optional(),
    warningDays: warningDaysSchema.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// Seller's Permit (CDTFA)
// ─────────────────────────────────────────────────────────────

export const CreateSellersPermitSchema = z.strictObject({
  premisesId: premisesIdSchema,
  permitNumber: permitNumberSchema,
  status: LicenseStatusEnum.default("PENDING"),
  issuedBy: z.literal("CDTFA").default("CDTFA"),
  issuedAt: dateCoerce.optional(),
  expiresAt: dateCoerce.optional(),
  warningDays: warningDaysSchema.default(90),
});

export const UpdateSellersPermitSchema = z
  .strictObject({
    id: cuidSchema,
    permitNumber: permitNumberSchema.optional(),
    status: LicenseStatusEnum.optional(),
    issuedAt: dateCoerce.optional(),
    expiresAt: dateCoerce.optional(),
    renewedAt: dateCoerce.optional(),
    warningDays: warningDaysSchema.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// Cannabis Tax Permit
// ─────────────────────────────────────────────────────────────

export const CreateCannabisTaxPermitSchema = z.strictObject({
  premisesId: premisesIdSchema,
  permitNumber: permitNumberSchema,
  status: LicenseStatusEnum.default("PENDING"),
  /** Issuing authority -- typically a city/county tax authority. */
  issuedBy: z.string().trim().min(1, "Issuing authority is required").max(200),
  issuedAt: dateCoerce.optional(),
  expiresAt: dateCoerce,
  warningDays: warningDaysSchema.default(90),
});

export const UpdateCannabisTaxPermitSchema = z
  .strictObject({
    id: cuidSchema,
    permitNumber: permitNumberSchema.optional(),
    status: LicenseStatusEnum.optional(),
    issuedBy: z.string().trim().min(1).max(200).optional(),
    issuedAt: dateCoerce.optional(),
    expiresAt: dateCoerce.optional(),
    renewedAt: dateCoerce.optional(),
    warningDays: warningDaysSchema.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// Surety Bond
// ─────────────────────────────────────────────────────────────

export const CreateSuretyBondSchema = z.strictObject({
  premisesId: premisesIdSchema,
  bondNumber: z
    .string()
    .trim()
    .min(1, "Bond number is required")
    .max(100, "Bond number must be 100 characters or fewer"),
  status: LicenseStatusEnum.default("PENDING"),
  /** Bonding/surety company name. */
  issuedBy: z.string().trim().min(1, "Bonding company is required").max(200),
  /** Bond face value in dollars. */
  bondAmount: z
    .number()
    .positive("Bond amount must be positive")
    .max(100_000_000, "Bond amount exceeds maximum"),
  issuedAt: dateCoerce.optional(),
  expiresAt: dateCoerce,
  warningDays: warningDaysSchema.default(90),
});

export const UpdateSuretyBondSchema = z
  .strictObject({
    id: cuidSchema,
    bondNumber: z.string().trim().min(1).max(100).optional(),
    status: LicenseStatusEnum.optional(),
    issuedBy: z.string().trim().min(1).max(200).optional(),
    bondAmount: z.number().positive().max(100_000_000).optional(),
    issuedAt: dateCoerce.optional(),
    expiresAt: dateCoerce.optional(),
    renewedAt: dateCoerce.optional(),
    warningDays: warningDaysSchema.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// 2. Local Authorization Schemas
//    City/county permits that sit on top of state DCC licenses
// ─────────────────────────────────────────────────────────────

export const CreateLocalAuthorizationSchema = z.strictObject({
  premisesId: premisesIdSchema,

  /** Issuing jurisdiction (e.g., "City of Los Angeles"). */
  authority: z
    .string()
    .trim()
    .min(1, "Authority is required")
    .max(200, "Authority must be 200 characters or fewer"),

  /** Permit number -- optional because some jurisdictions issue later. */
  permitNumber: z
    .string()
    .trim()
    .max(100, "Permit number must be 100 characters or fewer")
    .optional(),

  /**
   * Type of local authorization.
   * E.g., "Cannabis Business License", "Conditional Use Permit",
   * "Development Agreement".
   */
  type: z
    .string()
    .trim()
    .min(1, "Authorization type is required")
    .max(200, "Authorization type must be 200 characters or fewer"),

  status: LicenseStatusEnum.default("PENDING"),

  issuedAt: dateCoerce.optional(),
  expiresAt: dateCoerce.optional(),
});

export const UpdateLocalAuthorizationSchema = z
  .strictObject({
    id: cuidSchema,
    authority: z.string().trim().min(1).max(200).optional(),
    permitNumber: z.string().trim().max(100).optional(),
    type: z.string().trim().min(1).max(200).optional(),
    status: LicenseStatusEnum.optional(),
    issuedAt: dateCoerce.optional(),
    expiresAt: dateCoerce.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// 3. Local Rules Schemas
//    Per-city/county configurable compliance rules
// ─────────────────────────────────────────────────────────────

/**
 * Known rule keys for type-safe lookups.
 * Additional custom keys are allowed as long as they follow
 * the snake_case convention.
 */
const ruleKeySchema = z
  .string()
  .trim()
  .min(1, "Rule key is required")
  .max(100, "Rule key must be 100 characters or fewer")
  .regex(/^[a-z][a-z0-9_]*$/, "Rule key must be lowercase snake_case (e.g., 'local_tax_rate')");

export const CreateLocalRuleSchema = z.strictObject({
  premisesId: premisesIdSchema,

  /** Governing jurisdiction (e.g., "City of Los Angeles", "LA County"). */
  jurisdiction: z
    .string()
    .trim()
    .min(1, "Jurisdiction is required")
    .max(200, "Jurisdiction must be 200 characters or fewer"),

  /** Machine-readable rule identifier (snake_case). */
  ruleKey: ruleKeySchema,

  /**
   * Rule value stored as a string.
   * Consumers parse based on the key (e.g., "0.05" for a rate,
   * "true"/"false" for booleans, JSON for complex values).
   */
  ruleValue: z
    .string()
    .min(1, "Rule value is required")
    .max(2000, "Rule value must be 2000 characters or fewer"),

  /** Human-readable explanation of what this rule controls. */
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer")
    .optional(),

  /** When this rule takes effect. Defaults to now. */
  effectiveAt: dateCoerce.optional(),

  /** When this rule expires. Null means no expiration. */
  expiresAt: dateCoerce.optional(),
});

export const UpdateLocalRuleSchema = z
  .strictObject({
    id: cuidSchema,
    jurisdiction: z.string().trim().min(1).max(200).optional(),
    ruleKey: ruleKeySchema.optional(),
    ruleValue: z.string().min(1).max(2000).optional(),
    description: z.string().trim().max(1000).optional(),
    effectiveAt: dateCoerce.optional(),
    expiresAt: dateCoerce.nullable().optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

/**
 * Upsert schema for the rule engine -- matches the existing
 * upsertLocalRule action that keys on (premisesId, ruleKey).
 */
export const UpsertLocalRuleSchema = z.strictObject({
  premisesId: premisesIdSchema,
  jurisdiction: z.string().trim().min(1, "Jurisdiction is required").max(200),
  ruleKey: ruleKeySchema,
  ruleValue: z.string().min(1).max(2000),
  description: z.string().trim().max(1000).optional(),
  effectiveAt: dateCoerce.optional(),
  expiresAt: dateCoerce.nullable().optional(),
});

// ─────────────────────────────────────────────────────────────
// 4. Facility Schemas
//    Rooms/zones, inventory locations within a premises
// ─────────────────────────────────────────────────────────────

/**
 * Room types recognized by the system.
 * DCC requires tracking of limited-access areas and vault rooms.
 */
export const RoomTypeEnum = z.enum([
  "sales_floor",
  "vault",
  "receiving",
  "storage",
  "limited_access",
]);

export const CreateRoomSchema = z.strictObject({
  premisesId: premisesIdSchema,

  name: z
    .string()
    .trim()
    .min(1, "Room name is required")
    .max(100, "Room name must be 100 characters or fewer"),

  type: RoomTypeEnum,

  /** DCC requires limited-access areas to be tracked. */
  isLimitedAccess: z.boolean().default(false),

  /** Whether CCTV/surveillance covers this room. */
  hasSurveillance: z.boolean().default(false),
});

export const UpdateRoomSchema = z
  .strictObject({
    id: cuidSchema,
    name: z.string().trim().min(1).max(100).optional(),
    type: RoomTypeEnum.optional(),
    isLimitedAccess: z.boolean().optional(),
    hasSurveillance: z.boolean().optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

export const CreateInventoryLocationSchema = z.strictObject({
  premisesId: premisesIdSchema,

  /** Optional room assignment. Null = unassigned/general area. */
  roomId: cuidSchema.optional(),

  /** Human-readable location name (e.g., "Shelf A-1", "Safe #3"). */
  name: z
    .string()
    .trim()
    .min(1, "Location name is required")
    .max(100, "Location name must be 100 characters or fewer"),

  /** Scannable barcode for the physical location. */
  barcode: z.string().trim().max(100, "Barcode must be 100 characters or fewer").optional(),

  isActive: z.boolean().default(true),
});

export const UpdateInventoryLocationSchema = z
  .strictObject({
    id: cuidSchema,
    roomId: cuidSchema.nullable().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    barcode: z.string().trim().max(100).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// 5. Document Upload Metadata Schemas
//    Validates the metadata envelope for S3-backed file uploads.
//    The actual file bytes are handled by the upload handler;
//    these schemas validate the accompanying metadata.
// ─────────────────────────────────────────────────────────────

/** Allowed MIME types for document uploads. */
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const;

/** Maximum file size: 25 MB. */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const DocumentUploadMetadataSchema = z
  .strictObject({
    /** Document classification. */
    type: DocumentTypeEnum,

    /** Human-readable file name (sanitized, no path separators). */
    name: z
      .string()
      .trim()
      .min(1, "Document name is required")
      .max(255, "Document name must be 255 characters or fewer")
      .regex(
        /^[^/\\<>:"|?*]+$/,
        "Document name must not contain path separators or special characters"
      ),

    /** Optional description / notes about this document. */
    description: z
      .string()
      .trim()
      .max(1000, "Description must be 1000 characters or fewer")
      .optional(),

    /** MIME type reported by the client. Validated against allowlist. */
    mimeType: z.enum(ALLOWED_MIME_TYPES, {
      error: `Allowed file types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    }),

    /** File size in bytes. Enforced server-side as well. */
    sizeBytes: z
      .number()
      .int("File size must be a whole number")
      .min(1, "File cannot be empty")
      .max(MAX_FILE_SIZE_BYTES, `File size cannot exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`),

    /**
     * Polymorphic ownership -- exactly one of these must be provided
     * so we know which entity this document belongs to.
     */
    licenseId: cuidSchema.optional(),
    localAuthId: cuidSchema.optional(),
    vendorId: cuidSchema.optional(),
  })
  .refine(
    (data) => {
      const owners = [data.licenseId, data.localAuthId, data.vendorId].filter(
        (v) => v !== undefined
      );
      return owners.length === 1;
    },
    {
      message: "Exactly one owner must be specified: licenseId, localAuthId, or vendorId",
    }
  );

export const UpdateDocumentMetadataSchema = z
  .strictObject({
    id: cuidSchema,
    name: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/^[^/\\<>:"|?*]+$/)
      .optional(),
    description: z.string().trim().max(1000).optional(),
    type: DocumentTypeEnum.optional(),
  })
  .refine(hasUpdateFields, { message: UPDATE_REFINEMENT_MSG });

// ─────────────────────────────────────────────────────────────
// Type exports (inferred from schemas)
// ─────────────────────────────────────────────────────────────

export type IdParam = z.infer<typeof IdParamSchema>;
export type PremisesIdParam = z.infer<typeof PremisesIdParamSchema>;
export type LicenseExpirationQuery = z.infer<typeof LicenseExpirationQuerySchema>;
export type ComplianceListQuery = z.infer<typeof ComplianceListQuerySchema>;

export type CreateLicense = z.infer<typeof CreateLicenseSchema>;
export type UpdateLicense = z.infer<typeof UpdateLicenseSchema>;

export type CreateSellersPermit = z.infer<typeof CreateSellersPermitSchema>;
export type UpdateSellersPermit = z.infer<typeof UpdateSellersPermitSchema>;

export type CreateCannabisTaxPermit = z.infer<typeof CreateCannabisTaxPermitSchema>;
export type UpdateCannabisTaxPermit = z.infer<typeof UpdateCannabisTaxPermitSchema>;

export type CreateSuretyBond = z.infer<typeof CreateSuretyBondSchema>;
export type UpdateSuretyBond = z.infer<typeof UpdateSuretyBondSchema>;

export type CreateLocalAuthorization = z.infer<typeof CreateLocalAuthorizationSchema>;
export type UpdateLocalAuthorization = z.infer<typeof UpdateLocalAuthorizationSchema>;

export type CreateLocalRule = z.infer<typeof CreateLocalRuleSchema>;
export type UpdateLocalRule = z.infer<typeof UpdateLocalRuleSchema>;
export type UpsertLocalRule = z.infer<typeof UpsertLocalRuleSchema>;

export type CreateRoom = z.infer<typeof CreateRoomSchema>;
export type UpdateRoom = z.infer<typeof UpdateRoomSchema>;

export type CreateInventoryLocation = z.infer<typeof CreateInventoryLocationSchema>;
export type UpdateInventoryLocation = z.infer<typeof UpdateInventoryLocationSchema>;

export type DocumentUploadMetadata = z.infer<typeof DocumentUploadMetadataSchema>;
export type UpdateDocumentMetadata = z.infer<typeof UpdateDocumentMetadataSchema>;
