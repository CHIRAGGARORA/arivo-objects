import "server-only";
import { z } from "zod";
import { MAX_LINES, MAX_QTY_PER_LINE } from "./catalog";
import { INDIAN_STATES } from "@/lib/indian-states";


const text = (min: number, max: number, label = "This field") =>
  z
    .string({ message: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);
// Strip spaces/dashes and an optional +91 / 0 prefix, then require a 10-digit Indian mobile.
const phone = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));
export const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address"));

const couponCode = z.string().trim().max(40).optional().nullable();

export const checkoutSchema = z.object({
  clientRequestId: z.uuid(),
  couponCode,
  items: z
    .array(
      z.object({
        slug: z.string().max(100),
        variantId: z.string().max(100),
        // Validated as a number here; integer/range rules are enforced in priceCart
        // so the error messages stay specific.
        quantity: z.number(),
      })
    )
    .min(1)
    .max(MAX_LINES),
  customer: z.object({ name: text(2, 100, "Name"), email, phone }),
  address: z.object({
    line1: text(5, 200, "Address"),
    line2: z.string().trim().max(200).optional().nullable(),
    city: text(2, 100, "City"),
    state: z.enum(INDIAN_STATES, { message: "Select a state" }),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  }),
  // Anything else the browser sends (e.g. a price or total) is ignored.
});

export const couponCheckSchema = z.object({
  couponCode: z.string().trim().min(1).max(40),
  items: z
    .array(z.object({ slug: z.string().max(100), variantId: z.string().max(100), quantity: z.number() }))
    .min(1)
    .max(MAX_LINES),
  email: email.optional(),
});

export const verifySchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

/** Honeypot: real users never fill the hidden "website" field. */
export const contactSchema = z.object({
  name: text(2, 100, "Name"),
  email,
  message: text(10, 5000, "Message"),
  website: z.string().max(0).optional(),
});

export const newsletterSchema = z.object({
  email,
  consent: z.literal(true, { message: "Please confirm you'd like to receive emails" }),
  website: z.string().max(0).optional(),
});

export { MAX_QTY_PER_LINE };

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
