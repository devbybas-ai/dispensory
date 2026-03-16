"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { CustomerType, TaxType } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Receipt PDF Generator
// California cannabis retail receipt with DCC/CDTFA disclosures
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ReceiptData {
  orderNumber: string;
  orderDate: Date;
  premisesName: string;
  premisesAddress: string;
  licenseNumber: string | null;
  cashierName: string;
  customerType: CustomerType;
  lines: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discount: number;
  taxLines: {
    taxType: TaxType;
    taxRate: number;
    taxAmount: number;
    description: string | null;
  }[];
  totalTax: number;
  totalAmount: number;
  payments: {
    method: string;
    amount: number;
    tendered: number | null;
    change: number | null;
  }[];
}

interface GenerateReceiptResult {
  base64: string;
  filename: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const GOVT_WARNING =
  "GOVERNMENT WARNING: This product has intoxicating effects and may be habit forming. Marijuana can impair concentration, coordination, and judgment. Do not operate a vehicle or machinery under the influence of this drug. There may be health risks associated with consumption of this product. For use only by adults twenty-one years of age and older. Keep out of the reach of children.";

const ADULT_USE_NOTICE = "FOR USE ONLY BY ADULTS 21 YEARS OF AGE AND OLDER";

const MEDICINAL_NOTICE =
  "FOR USE ONLY BY PERSONS 18 YEARS OF AGE AND OLDER WITH A VALID PHYSICIAN RECOMMENDATION";

const PACIFIC_TZ = "America/Los_Angeles";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function decimalToNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTaxLabel(taxType: TaxType, description: string | null): string {
  if (description) return description;
  switch (taxType) {
    case "EXCISE_TAX":
      return "Cannabis Excise Tax";
    case "SALES_TAX":
      return "Sales Tax";
    case "LOCAL_CANNABIS_TAX":
      return "Local Cannabis Tax";
  }
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "DEBIT":
      return "Debit Card";
    case "ACH":
      return "ACH Transfer";
    default:
      return method;
  }
}

function formatCustomerType(type: CustomerType): string {
  switch (type) {
    case "ADULT_USE":
      return "Adult-Use";
    case "MEDICINAL":
      return "Medicinal";
  }
}

// ─────────────────────────────────────────────────────────────
// PDF Styles (thermal receipt ~80mm / 226pt width)
// ─────────────────────────────────────────────────────────────

const RECEIPT_WIDTH = 226; // ~80mm in points

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 10,
    width: RECEIPT_WIDTH,
    color: "#000000",
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  businessName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 2,
  },
  headerText: {
    fontSize: 7,
    textAlign: "center",
    marginBottom: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  labelText: {
    fontSize: 7,
    color: "#333333",
  },
  valueText: {
    fontSize: 7,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginBottom: 2,
    marginTop: 2,
  },
  lineItemRow: {
    marginBottom: 3,
  },
  lineItemName: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  lineItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 8,
  },
  lineItemQtyPrice: {
    fontSize: 7,
    color: "#333333",
  },
  lineItemTotal: {
    fontSize: 7,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  totalLabel: {
    fontSize: 8,
  },
  totalValue: {
    fontSize: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 2,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  disclosureSection: {
    marginTop: 6,
    paddingTop: 4,
  },
  disclosureText: {
    fontSize: 6,
    textAlign: "center",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  disclosureBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    textAlign: "center",
    marginBottom: 3,
  },
  footer: {
    marginTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  footerSubText: {
    fontSize: 6,
    textAlign: "center",
    marginTop: 2,
    color: "#666666",
  },
});

// ─────────────────────────────────────────────────────────────
// Receipt PDF Component (built with createElement)
// ─────────────────────────────────────────────────────────────

function buildReceiptDocument(data: ReceiptData) {
  const h = createElement;

  const orderDate = data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate);
  const ageNotice = data.customerType === "MEDICINAL" ? MEDICINAL_NOTICE : ADULT_USE_NOTICE;

  return h(
    Document,
    null,
    h(
      Page,
      { size: [RECEIPT_WIDTH, "auto"], style: styles.page },

      // ── Header: Business info ──
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.businessName }, data.premisesName),
        h(Text, { style: styles.headerText }, data.premisesAddress),
        data.licenseNumber
          ? h(Text, { style: styles.headerText }, `License: ${data.licenseNumber}`)
          : null
      ),

      h(View, { style: styles.divider }),

      // ── Order info ──
      h(
        View,
        null,
        h(
          View,
          { style: styles.row },
          h(Text, { style: styles.labelText }, "Order #:"),
          h(Text, { style: styles.valueText }, data.orderNumber)
        ),
        h(
          View,
          { style: styles.row },
          h(Text, { style: styles.labelText }, "Date:"),
          h(Text, { style: styles.valueText }, formatDate(orderDate))
        ),
        h(
          View,
          { style: styles.row },
          h(Text, { style: styles.labelText }, "Time:"),
          h(Text, { style: styles.valueText }, formatTime(orderDate))
        ),
        h(
          View,
          { style: styles.row },
          h(Text, { style: styles.labelText }, "Cashier:"),
          h(Text, { style: styles.valueText }, data.cashierName)
        ),
        h(
          View,
          { style: styles.row },
          h(Text, { style: styles.labelText }, "Customer Type:"),
          h(Text, { style: styles.valueText }, formatCustomerType(data.customerType))
        )
      ),

      h(View, { style: styles.divider }),

      // ── Line items ──
      h(
        View,
        null,
        h(Text, { style: styles.sectionTitle }, "Items"),
        ...data.lines.map((line, idx) =>
          h(
            View,
            { key: `line-${String(idx)}`, style: styles.lineItemRow },
            h(Text, { style: styles.lineItemName }, line.productName),
            h(
              View,
              { style: styles.lineItemDetails },
              h(
                Text,
                { style: styles.lineItemQtyPrice },
                `${String(line.quantity)} x ${formatCurrency(line.unitPrice)}`
              ),
              h(Text, { style: styles.lineItemTotal }, formatCurrency(line.lineTotal))
            )
          )
        )
      ),

      h(View, { style: styles.divider }),

      // ── Subtotal ──
      h(
        View,
        { style: styles.totalRow },
        h(Text, { style: styles.totalLabel }, "Subtotal"),
        h(Text, { style: styles.totalValue }, formatCurrency(data.subtotal))
      ),

      // ── Discount (if any) ──
      ...(data.discount > 0
        ? [
            h(
              View,
              { key: "discount", style: styles.totalRow },
              h(Text, { style: styles.totalLabel }, "Discount"),
              h(Text, { style: styles.totalValue }, `-${formatCurrency(data.discount)}`)
            ),
          ]
        : []),

      // ── Tax breakdown ──
      ...data.taxLines.map((tax, idx) =>
        h(
          View,
          { key: `tax-${String(idx)}`, style: styles.totalRow },
          h(
            Text,
            { style: styles.totalLabel },
            `${formatTaxLabel(tax.taxType, tax.description)} (${(tax.taxRate * 100).toFixed(2)}%)`
          ),
          h(Text, { style: styles.totalValue }, formatCurrency(tax.taxAmount))
        )
      ),

      h(View, { style: styles.divider }),

      // ── Grand total ──
      h(
        View,
        { style: styles.grandTotalRow },
        h(Text, { style: styles.grandTotalLabel }, "TOTAL"),
        h(Text, { style: styles.grandTotalValue }, formatCurrency(data.totalAmount))
      ),

      h(View, { style: styles.divider }),

      // ── Payment info ──
      h(
        View,
        null,
        h(Text, { style: styles.sectionTitle }, "Payment"),
        ...data.payments.map((payment, idx) =>
          h(
            View,
            { key: `pay-${String(idx)}` },
            h(
              View,
              { style: styles.totalRow },
              h(Text, { style: styles.totalLabel }, formatPaymentMethod(payment.method)),
              h(Text, { style: styles.totalValue }, formatCurrency(payment.amount))
            ),
            ...(payment.tendered !== null
              ? [
                  h(
                    View,
                    { key: `tendered-${String(idx)}`, style: styles.totalRow },
                    h(Text, { style: styles.labelText }, "  Tendered"),
                    h(Text, { style: styles.valueText }, formatCurrency(payment.tendered))
                  ),
                ]
              : []),
            ...(payment.change !== null && payment.change > 0
              ? [
                  h(
                    View,
                    { key: `change-${String(idx)}`, style: styles.totalRow },
                    h(Text, { style: styles.labelText }, "  Change"),
                    h(Text, { style: styles.valueText }, formatCurrency(payment.change))
                  ),
                ]
              : [])
          )
        )
      ),

      h(View, { style: styles.divider }),

      // ── California cannabis disclosures ──
      h(
        View,
        { style: styles.disclosureSection },
        h(Text, { style: styles.disclosureBold }, ageNotice),
        h(Text, { style: styles.disclosureText }, GOVT_WARNING)
      ),

      h(View, { style: styles.divider }),

      // ── Footer ──
      h(
        View,
        { style: styles.footer },
        h(Text, { style: styles.footerText }, "Thank you for your purchase!"),
        h(
          Text,
          { style: styles.footerSubText },
          `Receipt generated ${formatDate(orderDate)} ${formatTime(orderDate)} PT`
        )
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────
// Main export: Server Action
// ─────────────────────────────────────────────────────────────

/**
 * Generate a PDF receipt for a completed order.
 *
 * Requires "pos:read" permission.
 * Returns the PDF as a base64-encoded string and a suggested filename.
 */
export async function generateReceipt(orderId: string): Promise<GenerateReceiptResult> {
  await requirePermission("pos:read");

  // Fetch the order with all related data
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      lines: true,
      taxLines: true,
      payments: true,
      customer: true,
      cashier: { select: { id: true, name: true, employeeId: true } },
      premises: {
        include: {
          licenses: {
            where: {
              status: "ACTIVE",
              licenseType: {
                in: ["ADULT_USE_RETAIL", "MEDICINAL_RETAIL", "MICROBUSINESS"],
              },
            },
            orderBy: { issuedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Build premises address
  const premises = order.premises;
  const premisesAddress = [premises.street, `${premises.city}, ${premises.state} ${premises.zip}`]
    .filter(Boolean)
    .join("\n");

  // Get the active DCC license number (if any)
  const activeLicense = premises.licenses[0] ?? null;
  const licenseNumber = activeLicense?.licenseNumber ?? null;

  // Map order data to receipt format
  const receiptData: ReceiptData = {
    orderNumber: order.orderNumber,
    orderDate: order.completedAt ?? order.createdAt,
    premisesName: premises.name,
    premisesAddress,
    licenseNumber,
    cashierName: order.cashier.name,
    customerType: order.type,
    lines: order.lines.map((line) => ({
      productName: line.productName,
      quantity: decimalToNumber(line.quantity),
      unitPrice: decimalToNumber(line.unitPrice),
      lineTotal: decimalToNumber(line.lineTotal),
    })),
    subtotal: decimalToNumber(order.subtotal),
    discount: decimalToNumber(order.discount),
    taxLines: order.taxLines.map((tax) => ({
      taxType: tax.taxType,
      taxRate: decimalToNumber(tax.taxRate),
      taxAmount: decimalToNumber(tax.taxAmount),
      description: tax.description,
    })),
    totalTax: decimalToNumber(order.totalTax),
    totalAmount: decimalToNumber(order.totalAmount),
    payments: order.payments.map((payment) => ({
      method: payment.method,
      amount: decimalToNumber(payment.amount),
      tendered: payment.tendered !== null ? decimalToNumber(payment.tendered) : null,
      change: payment.change !== null ? decimalToNumber(payment.change) : null,
    })),
  };

  // Render the PDF to a buffer
  const doc = buildReceiptDocument(receiptData);
  const buffer = await renderToBuffer(doc);

  // Convert to base64 for serialization over server action boundary
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `receipt-${order.orderNumber}.pdf`;

  return { base64, filename };
}
