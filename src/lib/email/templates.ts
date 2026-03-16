// === EMAIL TEMPLATES ===
// Plain HTML email templates with inline styles for maximum email client compatibility.
// Each function returns { subject, html, text } for use with sendEmail().

// ─────────────────────────────────────────────────────────────
// Shared layout wrapper
// ─────────────────────────────────────────────────────────────

function wrapInLayout(dispensaryName: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dispensaryName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">${dispensaryName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                This is an automated message from ${dispensaryName}. Do not reply to this email.
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-align: center;">
                Powered by Dispensory &mdash; Cannabis Dispensary Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// 1. License Expiration Alert
// ─────────────────────────────────────────────────────────────

interface LicenseExpirationParams {
  dispensaryName: string;
  premisesName: string;
  licenseNumber: string;
  licenseType: string;
  expiresAt: string; // ISO date string
  daysUntilExpiry: number;
  urgency: "critical" | "warning" | "notice";
  recipientName: string;
}

/**
 * Email template for license expiration alerts.
 * Sent daily when licenses approach their expiration date.
 */
export function licenseExpirationAlert(params: LicenseExpirationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expirationDate = new Date(params.expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const urgencyColors = {
    critical: { bg: "#fef2f2", border: "#dc2626", text: "#991b1b", label: "URGENT" },
    warning: { bg: "#fffbeb", border: "#d97706", text: "#92400e", label: "WARNING" },
    notice: { bg: "#eff6ff", border: "#2563eb", text: "#1e40af", label: "NOTICE" },
  };

  const colors = urgencyColors[params.urgency];
  const licenseTypeFormatted = params.licenseType.replace(/_/g, " ");

  const subject = `[${colors.label}] License ${params.licenseNumber} expires in ${params.daysUntilExpiry} days`;

  const bodyContent = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">
      Hi ${params.recipientName},
    </p>

    <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${colors.text};">
        ${colors.label}: License Expiration in ${params.daysUntilExpiry} Days
      </p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 140px;">License Number</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${params.licenseNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">License Type</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${licenseTypeFormatted}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Premises</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${params.premisesName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Expires On</td>
        <td style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 600;">${expirationDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Days Remaining</td>
        <td style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 600;">${params.daysUntilExpiry} days</td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
      California DCC requires all cannabis retail licenses to be current and valid at all times.
      Operating with an expired license is a serious compliance violation that may result in
      suspension, revocation, or civil penalties.
    </p>

    <p style="margin: 0; font-size: 14px; color: #374151;">
      Please initiate the renewal process as soon as possible to ensure uninterrupted operations.
    </p>
  `;

  const html = wrapInLayout(params.dispensaryName, bodyContent);

  const text = `${colors.label}: License Expiration in ${params.daysUntilExpiry} Days

Hi ${params.recipientName},

License ${params.licenseNumber} (${licenseTypeFormatted}) for ${params.premisesName} expires on ${expirationDate} (${params.daysUntilExpiry} days remaining).

California DCC requires all cannabis retail licenses to be current and valid at all times. Operating with an expired license is a serious compliance violation.

Please initiate the renewal process as soon as possible.

-- ${params.dispensaryName}`;

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────
// 2. Daily Sales Report
// ─────────────────────────────────────────────────────────────

interface DailySalesReportParams {
  dispensaryName: string;
  premisesName: string;
  date: string; // YYYY-MM-DD
  totalOrders: number;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  averageOrderValue: number;
  voidCount: number;
  voidedAmount: number;
  paymentBreakdown: Array<{ method: string; count: number; total: number }>;
  recipientName: string;
}

/**
 * Email template for daily sales summary reports.
 * Sent nightly at close of business.
 */
export function dailySalesReport(params: DailySalesReportParams): {
  subject: string;
  html: string;
  text: string;
} {
  const reportDate = new Date(params.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const paymentRows = params.paymentBreakdown
    .map(
      (p) => `
      <tr>
        <td style="padding: 6px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6;">${p.method}</td>
        <td style="padding: 6px 12px; font-size: 13px; color: #374151; text-align: center; border-bottom: 1px solid #f3f4f6;">${p.count}</td>
        <td style="padding: 6px 12px; font-size: 13px; color: #374151; text-align: right; border-bottom: 1px solid #f3f4f6;">${fmt(p.total)}</td>
      </tr>`
    )
    .join("");

  const paymentTextRows = params.paymentBreakdown
    .map((p) => `  ${p.method}: ${p.count} transactions, ${fmt(p.total)}`)
    .join("\n");

  const subject = `Daily Sales Report - ${params.premisesName} - ${params.date}`;

  const bodyContent = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">
      Hi ${params.recipientName},
    </p>

    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
      Here is the daily sales summary for <strong>${params.premisesName}</strong> on ${reportDate}.
    </p>

    <!-- Summary Cards -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td width="50%" style="padding: 0 8px 8px 0;">
          <div style="background-color: #f0fdf4; border-radius: 6px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total Revenue</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #15803d;">${fmt(params.grandTotal)}</p>
          </div>
        </td>
        <td width="50%" style="padding: 0 0 8px 8px;">
          <div style="background-color: #eff6ff; border-radius: 6px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total Orders</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1d4ed8;">${params.totalOrders}</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Details -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 180px;">Subtotal (pre-tax)</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500; text-align: right;">${fmt(params.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Total Tax Collected</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500; text-align: right;">${fmt(params.totalTax)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Average Order Value</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500; text-align: right;">${fmt(params.averageOrderValue)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Voided Orders</td>
        <td style="padding: 8px 0; font-size: 14px; color: ${params.voidCount > 0 ? "#dc2626" : "#111827"}; font-weight: 500; text-align: right;">${params.voidCount} (${fmt(params.voidedAmount)})</td>
      </tr>
    </table>

    ${
      params.paymentBreakdown.length > 0
        ? `
    <!-- Payment Breakdown -->
    <h3 style="margin: 0 0 12px; font-size: 14px; color: #111827; font-weight: 600;">Payment Breakdown</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
      <tr style="background-color: #f9fafb;">
        <th style="padding: 8px 12px; font-size: 12px; color: #6b7280; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Method</th>
        <th style="padding: 8px 12px; font-size: 12px; color: #6b7280; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Count</th>
        <th style="padding: 8px 12px; font-size: 12px; color: #6b7280; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
      </tr>
      ${paymentRows}
    </table>`
        : ""
    }

    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
      Report generated automatically at end of business day.
    </p>
  `;

  const html = wrapInLayout(params.dispensaryName, bodyContent);

  const text = `Daily Sales Report - ${params.premisesName} - ${reportDate}

Hi ${params.recipientName},

SUMMARY
  Total Revenue: ${fmt(params.grandTotal)}
  Total Orders: ${params.totalOrders}
  Subtotal (pre-tax): ${fmt(params.subtotal)}
  Total Tax Collected: ${fmt(params.totalTax)}
  Average Order Value: ${fmt(params.averageOrderValue)}
  Voided Orders: ${params.voidCount} (${fmt(params.voidedAmount)})

PAYMENT BREAKDOWN
${paymentTextRows || "  No transactions"}

-- ${params.dispensaryName}`;

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────
// 3. Shift Variance Alert
// ─────────────────────────────────────────────────────────────

interface ShiftVarianceAlertParams {
  dispensaryName: string;
  premisesName: string;
  shiftId: string;
  employeeName: string;
  register: string;
  expectedCash: number;
  actualCash: number;
  variance: number;
  shiftStart: string; // ISO datetime
  shiftEnd: string; // ISO datetime
  recipientName: string;
}

/**
 * Email template for cash drawer variance alerts.
 * Sent when a shift is reconciled with a significant variance.
 */
export function shiftVarianceAlert(params: ShiftVarianceAlertParams): {
  subject: string;
  html: string;
  text: string;
} {
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const isOver = params.variance > 0;
  const varianceLabel = isOver ? "OVER" : "SHORT";
  const varianceColor = isOver ? "#d97706" : "#dc2626";
  const varianceBg = isOver ? "#fffbeb" : "#fef2f2";
  const absVariance = Math.abs(params.variance);

  const shiftStartFormatted = new Date(params.shiftStart).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const shiftEndFormatted = new Date(params.shiftEnd).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const subject = `Cash Drawer Variance Alert - ${params.premisesName} - ${varianceLabel} ${fmt(absVariance)}`;

  const bodyContent = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">
      Hi ${params.recipientName},
    </p>

    <div style="background-color: ${varianceBg}; border-left: 4px solid ${varianceColor}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${varianceColor};">
        Cash Drawer Variance Detected: ${varianceLabel} ${fmt(absVariance)}
      </p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 160px;">Employee</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${params.employeeName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Register</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${params.register}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Premises</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${params.premisesName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Shift</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${shiftStartFormatted} &ndash; ${shiftEndFormatted}</td>
      </tr>
      <tr style="border-top: 1px solid #e5e7eb;">
        <td style="padding: 12px 0 8px; font-size: 14px; color: #6b7280;">Expected Cash</td>
        <td style="padding: 12px 0 8px; font-size: 14px; color: #111827; font-weight: 500; text-align: right;">${fmt(params.expectedCash)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Actual Cash</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500; text-align: right;">${fmt(params.actualCash)}</td>
      </tr>
      <tr style="border-top: 2px solid #e5e7eb;">
        <td style="padding: 12px 0 8px; font-size: 14px; color: ${varianceColor}; font-weight: 600;">Variance</td>
        <td style="padding: 12px 0 8px; font-size: 16px; color: ${varianceColor}; font-weight: 700; text-align: right;">${isOver ? "+" : "-"}${fmt(absVariance)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
      This variance has been recorded in the shift reconciliation log (Shift ID: ${params.shiftId}).
      Please review the shift details and take appropriate action per your cash handling policy.
    </p>

    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
      All cash variances are logged in the audit trail for compliance purposes.
    </p>
  `;

  const html = wrapInLayout(params.dispensaryName, bodyContent);

  const text = `Cash Drawer Variance Alert - ${params.premisesName}

Hi ${params.recipientName},

A cash drawer variance has been detected during shift reconciliation.

Employee: ${params.employeeName}
Register: ${params.register}
Premises: ${params.premisesName}
Shift: ${shiftStartFormatted} - ${shiftEndFormatted}

Expected Cash: ${fmt(params.expectedCash)}
Actual Cash: ${fmt(params.actualCash)}
Variance: ${isOver ? "+" : "-"}${fmt(absVariance)} (${varianceLabel})

Shift ID: ${params.shiftId}
Please review the shift details and take appropriate action per your cash handling policy.

-- ${params.dispensaryName}`;

  return { subject, html, text };
}
