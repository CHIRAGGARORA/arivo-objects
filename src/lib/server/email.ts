import "server-only";
import { config } from "./config";
import { siteConfig } from "@/lib/siteConfig";

const API = "https://api.resend.com";

export class EmailError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "EmailError";
  }
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Resend de-duplicates sends with the same key for 24h. */
  idempotencyKey: string;
}

export function emailConfigured(): boolean {
  const { apiKey, from } = config.resend();
  return Boolean(apiKey && from);
}

export async function sendEmail(msg: EmailMessage): Promise<{ id: string }> {
  const { apiKey, from } = config.resend();
  if (!apiKey || !from) throw new EmailError("Email is not configured (RESEND_API_KEY / EMAIL_FROM)", false);

  let res: Response;
  try {
    res = await fetch(`${API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": msg.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.replyTo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new EmailError(`Resend request failed: ${(err as Error).message}`, true);
  }
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    // 4xx (bad sender, unverified domain, invalid recipient) won't fix itself on retry,
    // except 409 (idempotent request still in flight) and 429 (rate limit).
    const retryable = res.status >= 500 || res.status === 429 || res.status === 409;
    throw new EmailError(`Resend send failed (${res.status}): ${text}`, retryable);
  }
  const body = (await res.json()) as { id: string };
  return { id: body.id };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0 })}`;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    productSlug: string;
    variantId: string;
    name: string;
    variantLabel: string;
    quantity: number;
    unitPricePaise: number;
  }[];
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  razorpayPaymentId: string;
  statusUrl: string;
}

function itemsTable(d: OrderEmailData) {
  const rows = d.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${escapeHtml(i.name)} — ${escapeHtml(i.variantLabel)} × ${i.quantity}</td>` +
        `<td style="padding:4px 0;text-align:right">${rupees(i.unitPricePaise * i.quantity)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding-top:8px">Subtotal</td><td style="padding-top:8px;text-align:right">${rupees(d.subtotalPaise)}</td></tr>
<tr><td>Shipping</td><td style="text-align:right">${rupees(d.shippingPaise)}</td></tr>
<tr><td style="font-weight:600">Total paid</td><td style="text-align:right;font-weight:600">${rupees(d.totalPaise)}</td></tr></table>`;
}

function itemsText(d: OrderEmailData) {
  return [
    ...d.items.map((i) => `- ${i.name} — ${i.variantLabel} x ${i.quantity}: ${rupees(i.unitPricePaise * i.quantity)}`),
    `Subtotal: ${rupees(d.subtotalPaise)}`,
    `Shipping: ${rupees(d.shippingPaise)}`,
    `Total paid: ${rupees(d.totalPaise)}`,
  ].join("\n");
}

function addressText(a: OrderEmailData["address"]) {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join("\n");
}

const wrap = (inner: string) =>
  `<div style="font-family:Georgia,serif;color:#2B2A28;max-width:560px;margin:0 auto;line-height:1.5">${inner}</div>`;

export function customerConfirmationEmail(d: OrderEmailData): Omit<EmailMessage, "idempotencyKey"> {
  const brand = siteConfig.brandName;
  return {
    to: d.customerEmail,
    subject: `${brand} — order ${d.orderNumber} confirmed`,
    html: wrap(`<h2 style="font-weight:normal">Thank you, ${escapeHtml(d.customerName)}.</h2>
<p>We've received your payment for order <strong>${escapeHtml(d.orderNumber)}</strong>.</p>
${itemsTable(d)}
<p style="margin-top:16px"><strong>Shipping to</strong><br>${escapeHtml(addressText(d.address)).replace(/\n/g, "<br>")}</p>
<p>We'll email you again when your order is dispatched. You can check its status at any time:<br>
<a href="${escapeHtml(d.statusUrl)}">${escapeHtml(d.statusUrl)}</a></p>
<p style="font-size:12px;color:#777">Payment reference: ${escapeHtml(d.razorpayPaymentId)}</p>`),
    text: `Thank you, ${d.customerName}.\n\nWe've received your payment for order ${d.orderNumber}.\n\n${itemsText(d)}\n\nShipping to:\n${addressText(d.address)}\n\nOrder status: ${d.statusUrl}\nPayment reference: ${d.razorpayPaymentId}`,
  };
}

export function ownerOrderEmail(d: OrderEmailData, ownerEmail: string): Omit<EmailMessage, "idempotencyKey"> {
  return {
    to: ownerEmail,
    replyTo: d.customerEmail,
    subject: `New paid order ${d.orderNumber} — ${rupees(d.totalPaise)}`,
    html: wrap(`<h2 style="font-weight:normal">New paid order ${escapeHtml(d.orderNumber)}</h2>
${itemsTable(d)}
<p><strong>Customer</strong><br>${escapeHtml(d.customerName)}<br>${escapeHtml(d.customerEmail)}<br>${escapeHtml(d.customerPhone)}</p>
<p><strong>Ship to</strong><br>${escapeHtml(addressText(d.address)).replace(/\n/g, "<br>")}</p>
<p>Razorpay payment: ${escapeHtml(d.razorpayPaymentId)}</p>
<p>Shiprocket order creation runs next; you'll get a separate email if it needs attention. Select the courier and schedule pickup in Shiprocket.</p>`),
    text: `New paid order ${d.orderNumber}\n\n${itemsText(d)}\n\nCustomer: ${d.customerName}, ${d.customerEmail}, ${d.customerPhone}\nShip to:\n${addressText(d.address)}\n\nRazorpay payment: ${d.razorpayPaymentId}`,
  };
}

export function shippingAlertEmail(
  orderNumber: string,
  reason: string,
  ownerEmail: string
): Omit<EmailMessage, "idempotencyKey"> {
  return {
    to: ownerEmail,
    subject: `Action needed: order ${orderNumber} was not sent to Shiprocket`,
    html: wrap(`<h2 style="font-weight:normal">Order ${escapeHtml(orderNumber)} needs manual shipping</h2>
<p>The order is <strong>paid and saved</strong>, but it could not be created in Shiprocket automatically:</p>
<p style="background:#f4f1ec;padding:12px">${escapeHtml(reason)}</p>
<p>Open the admin page to retry, or create the order manually in the Shiprocket dashboard.</p>`),
    text: `Order ${orderNumber} is paid and saved, but could not be created in Shiprocket automatically:\n\n${reason}\n\nRetry from the admin page, or create it manually in Shiprocket.`,
  };
}

export function contactNotificationEmail(
  m: { id: number; name: string; email: string; message: string },
  ownerEmail: string
): EmailMessage {
  return {
    to: ownerEmail,
    replyTo: m.email,
    subject: `Website enquiry from ${m.name.slice(0, 60)}`,
    html: wrap(`<p><strong>${escapeHtml(m.name)}</strong> &lt;${escapeHtml(m.email)}&gt; wrote:</p>
<p style="white-space:pre-wrap;background:#f4f1ec;padding:12px">${escapeHtml(m.message)}</p>
<p style="font-size:12px;color:#777">Reply directly to this email to respond.</p>`),
    text: `${m.name} <${m.email}> wrote:\n\n${m.message}`,
    idempotencyKey: `contact-${m.id}`,
  };
}
