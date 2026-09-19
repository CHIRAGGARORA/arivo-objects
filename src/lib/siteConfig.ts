/**
 * siteConfig.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for brand + business information used across the
 * site (header, footer, contact page, SEO metadata, structured data).
 *
 * IMPORTANT — DO NOT HARDCODE REAL SECRETS HERE OR ANYWHERE ELSE.
 * This file is bundled into the public frontend. Anything placed in a value
 * below can end up in client-visible HTML/JS. Payment keys, bank details,
 * and API secrets must NEVER be added here — see "NEVER PUBLIC" note below.
 *
 * Fields currently `null` are intentionally unset because the business has
 * not yet finalised them (no GST registration, no business bank account, no
 * payment gateway account, no dedicated business phone/address). Replace
 * each `null` only once the real, confirmed value exists.
 * ---------------------------------------------------------------------------
 */

export type PaymentProvider = "razorpay" | null;
export type ShippingProvider = "shiprocket" | "delhivery" | null;

export interface SiteConfig {
  brandName: string;
  legalName: string | null; // e.g. "Arivo Objects Pvt Ltd" or proprietor name — PENDING
  domain: string;
  email: string | null; // hello@arivoobjects.com once the mailbox exists
  instagramHandle: string | null; // e.g. "arivoobjects" — set once confirmed
  instagramUrl: string | null;
  phone: string | null; // NEVER a personal number — business line only, PENDING
  businessAddress: string | null; // PENDING — used only for legal pages once available
  gstin: string | null; // [GST_PENDING] — do not publish until registered
  pan: string | null; // NEVER PUBLIC — for internal/admin use only if ever added
  currency: string;
  currencySymbol: string;
  paymentProvider: PaymentProvider;
  shippingProvider: ShippingProvider;
  socials: {
    instagram: string | null;
  };
}

export const siteConfig: SiteConfig = {
  brandName: "ARIVO OBJECTS",
  legalName: null, // [BUSINESS_NAME_PENDING]
  domain: "arivoobjects.com",
  email: null, // [BUSINESS_EMAIL_PENDING] — intended: hello@arivoobjects.com
  instagramHandle: "arivoobjects",
  instagramUrl: "https://www.instagram.com/arivoobjects/",
  phone: null, // [PHONE_PENDING] — do not substitute a personal number
  businessAddress: null, // [BUSINESS_ADDRESS_PENDING]
  gstin: null, // [GST_PENDING]
  pan: null, // NEVER PUBLIC
  currency: "INR",
  currencySymbol: "₹",
  paymentProvider: null, // [GATEWAY_PENDING] — planned: razorpay
  shippingProvider: null, // [SHIPPING_PROVIDER_PENDING]
  socials: {
    instagram: "https://www.instagram.com/arivoobjects/",
  },
};

/**
 * Fields that are safe to ever render in frontend HTML/JS, once populated.
 * Everything else (PAN, bank details, API secrets, payment keys) must live
 * only in server-side environment variables (.env.local, never committed)
 * and must never be imported into a client component.
 */
export const PUBLIC_SAFE_FIELDS: (keyof SiteConfig)[] = [
  "brandName",
  "domain",
  "email",
  "instagramHandle",
  "instagramUrl",
  "currency",
  "currencySymbol",
];

export const NEVER_EXPOSE_CLIENT_SIDE = [
  "Razorpay key secret (only the public key_id may ever reach the client)",
  "Bank account / IFSC details",
  "PAN",
  "GST login credentials",
  "Personal phone number",
  "Any .env value without the NEXT_PUBLIC_ prefix",
];
