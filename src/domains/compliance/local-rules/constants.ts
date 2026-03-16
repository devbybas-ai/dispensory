// ─────────────────────────────────────────────────────────────
// Standard rule keys for cannabis compliance
// ─────────────────────────────────────────────────────────────

export const STANDARD_RULE_KEYS = {
  /** Maximum operating hours (overrides state 6AM-10PM) */
  OPERATING_HOURS_OPEN: "operating_hours_open",
  OPERATING_HOURS_CLOSE: "operating_hours_close",

  /** Whether delivery is allowed */
  DELIVERY_ALLOWED: "delivery_allowed",

  /** Local cannabis tax rate (decimal, e.g. "0.05" for 5%) */
  LOCAL_CANNABIS_TAX_RATE: "local_cannabis_tax_rate",

  /** Maximum number of plants (if applicable) */
  MAX_PLANTS: "max_plants",

  /** Buffer zone distance from schools (feet) */
  SCHOOL_BUFFER_FEET: "school_buffer_feet",

  /** Whether on-site consumption is allowed */
  ONSITE_CONSUMPTION: "onsite_consumption",

  /** Maximum daily purchase limit (grams) */
  DAILY_PURCHASE_LIMIT_GRAMS: "daily_purchase_limit_grams",

  /** Required local permit types */
  REQUIRED_PERMIT_TYPES: "required_permit_types",
} as const;
