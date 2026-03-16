import { describe, it, expect } from "vitest";
import { calculateTaxLines, sumTaxLines } from "@/domains/finance/tax/tax-engine";

describe("Tax Engine", () => {
  it("calculates excise tax at 15%", () => {
    const lines = calculateTaxLines(100, {
      salesTaxRate: 0,
      localCannabisTaxRate: 0,
    });

    const excise = lines.find((l) => l.taxType === "EXCISE_TAX");
    expect(excise).toBeDefined();
    expect(excise!.taxRate).toBe(0.15);
    expect(excise!.taxAmount).toBe(15);
    expect(excise!.taxableAmount).toBe(100);
  });

  it("calculates sales tax on subtotal + excise", () => {
    const lines = calculateTaxLines(100, {
      salesTaxRate: 0.0725,
      exciseTaxRate: 0.15,
      localCannabisTaxRate: 0,
    });

    const salesTax = lines.find((l) => l.taxType === "SALES_TAX");
    expect(salesTax).toBeDefined();
    // Sales tax base = 100 + 15 (excise) = 115
    expect(salesTax!.taxableAmount).toBe(115);
    expect(salesTax!.taxAmount).toBe(8.34); // 115 * 0.0725 = 8.3375, rounded
  });

  it("calculates local cannabis tax separately", () => {
    const lines = calculateTaxLines(100, {
      salesTaxRate: 0,
      exciseTaxRate: 0,
      localCannabisTaxRate: 0.05,
    });

    const local = lines.find((l) => l.taxType === "LOCAL_CANNABIS_TAX");
    expect(local).toBeDefined();
    expect(local!.taxAmount).toBe(5);
    expect(local!.taxableAmount).toBe(100);
  });

  it("calculates all three taxes together", () => {
    const lines = calculateTaxLines(100, {
      salesTaxRate: 0.0725,
      exciseTaxRate: 0.15,
      localCannabisTaxRate: 0.05,
    });

    expect(lines).toHaveLength(3);
    const total = sumTaxLines(lines);
    // excise: 15.00, sales: 8.34 (on 115), local: 5.00
    expect(total).toBe(28.34);
  });

  it("handles zero subtotal", () => {
    const lines = calculateTaxLines(0);
    const total = sumTaxLines(lines);
    expect(total).toBe(0);
  });

  it("uses California defaults when no config provided", () => {
    const lines = calculateTaxLines(100);

    expect(lines.find((l) => l.taxType === "EXCISE_TAX")).toBeDefined();
    expect(lines.find((l) => l.taxType === "SALES_TAX")).toBeDefined();
    // Local tax defaults to 0, so no local line
    expect(lines.find((l) => l.taxType === "LOCAL_CANNABIS_TAX")).toBeUndefined();
  });

  it("rounds currency to 2 decimal places", () => {
    // $33.33 * 0.15 = 4.9995 → should round to 5.00
    const lines = calculateTaxLines(33.33, {
      salesTaxRate: 0,
      localCannabisTaxRate: 0,
    });

    const excise = lines.find((l) => l.taxType === "EXCISE_TAX");
    expect(excise!.taxAmount).toBe(5);
  });
});
