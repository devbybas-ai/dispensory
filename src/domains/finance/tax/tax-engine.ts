import type { TaxType } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Tax Engine
// California cannabis: sales tax + 15% excise tax + local tax
// Each tax is a separate line (as required by CDTFA)
// ─────────────────────────────────────────────────────────────

interface TaxLineResult {
  taxType: TaxType;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  description: string;
}

interface TaxConfig {
  /** State sales tax rate (e.g., 0.0725 for 7.25%) */
  salesTaxRate: number;
  /** Cannabis excise tax rate (15% as of Jan 1, 2026) */
  exciseTaxRate: number;
  /** Local cannabis tax rate (varies by city/county, e.g., 0.05 for 5%) */
  localCannabisTaxRate: number;
}

/** Default California tax rates */
const CA_DEFAULTS: TaxConfig = {
  salesTaxRate: 0.0725, // CA base rate (actual varies by district)
  exciseTaxRate: 0.15, // 15% cannabis excise tax
  localCannabisTaxRate: 0, // Varies by locality
};

/**
 * Calculate all tax lines for a subtotal.
 * Returns separate lines for each tax type (required for CDTFA reporting).
 */
export function calculateTaxLines(
  subtotal: number,
  config: Partial<TaxConfig> = {}
): TaxLineResult[] {
  const rates = { ...CA_DEFAULTS, ...config };
  const lines: TaxLineResult[] = [];

  // 1. Cannabis excise tax (15%, collected from purchaser)
  if (rates.exciseTaxRate > 0) {
    const exciseAmount = roundCurrency(subtotal * rates.exciseTaxRate);
    lines.push({
      taxType: "EXCISE_TAX",
      taxRate: rates.exciseTaxRate,
      taxableAmount: subtotal,
      taxAmount: exciseAmount,
      description: `Cannabis excise tax (${(rates.exciseTaxRate * 100).toFixed(1)}%)`,
    });
  }

  // 2. Sales tax (applied to subtotal + excise tax in CA)
  // In California, sales tax is calculated on the retail price which includes excise tax
  const exciseAmount = roundCurrency(subtotal * rates.exciseTaxRate);
  const salesTaxBase = subtotal + exciseAmount;

  if (rates.salesTaxRate > 0) {
    const salesTaxAmount = roundCurrency(salesTaxBase * rates.salesTaxRate);
    lines.push({
      taxType: "SALES_TAX",
      taxRate: rates.salesTaxRate,
      taxableAmount: salesTaxBase,
      taxAmount: salesTaxAmount,
      description: `Sales tax (${(rates.salesTaxRate * 100).toFixed(2)}%)`,
    });
  }

  // 3. Local cannabis tax (varies by jurisdiction)
  if (rates.localCannabisTaxRate > 0) {
    const localAmount = roundCurrency(subtotal * rates.localCannabisTaxRate);
    lines.push({
      taxType: "LOCAL_CANNABIS_TAX",
      taxRate: rates.localCannabisTaxRate,
      taxableAmount: subtotal,
      taxAmount: localAmount,
      description: `Local cannabis tax (${(rates.localCannabisTaxRate * 100).toFixed(1)}%)`,
    });
  }

  return lines;
}

/** Sum total tax from all tax lines. */
export function sumTaxLines(lines: TaxLineResult[]): number {
  return roundCurrency(lines.reduce((sum, line) => sum + line.taxAmount, 0));
}

/** Round to 2 decimal places (currency). */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export type { TaxConfig, TaxLineResult };
