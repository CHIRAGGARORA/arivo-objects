import "server-only";

/**
 * Server-only configuration. Reads environment variables lazily (so tests can
 * set them per case) and never returns secret values to callers that render
 * or log — use `integrationStatus()` for anything user-visible.
 */

export type DeployEnv = "production" | "preview" | "development";

export function deployEnv(): DeployEnv {
  const v = process.env.VERCEL_ENV;
  if (v === "production" || v === "preview") return v;
  return "development";
}

function get(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

export const config = {
  databaseUrl: () => get("DATABASE_URL"),

  razorpay: () => ({
    keyId: get("RAZORPAY_KEY_ID"),
    keySecret: get("RAZORPAY_KEY_SECRET"),
    webhookSecret: get("RAZORPAY_WEBHOOK_SECRET"),
  }),
  /** Live keys are refused unless the owner has explicitly approved going live. */
  livePaymentsApproved: () => get("PAYMENTS_LIVE_APPROVED") === "true",

  resend: () => ({
    apiKey: get("RESEND_API_KEY"),
    from: get("EMAIL_FROM"),
    ownerEmail: get("OWNER_EMAIL"),
  }),

  shiprocket: () => ({
    email: get("SHIPROCKET_API_EMAIL"),
    password: get("SHIPROCKET_API_PASSWORD"),
    pickupLocation: get("SHIPROCKET_PICKUP_LOCATION"),
    pickupPincode: get("SHIPROCKET_PICKUP_PINCODE"),
  }),

  /** Salt for hashing client IPs in rate-limit keys. */
  ipHashSalt: () => get("IP_HASH_SALT") ?? get("RAZORPAY_WEBHOOK_SECRET") ?? "arivo-dev-salt",
  cronSecret: () => get("CRON_SECRET"),
  adminPassword: () => get("ADMIN_PASSWORD"),
  siteUrl: () => get("SITE_URL") ?? (get("VERCEL_URL") ? `https://${get("VERCEL_URL")}` : "http://localhost:3000"),
};

export type CheckoutBlockReason =
  | "database_not_configured"
  | "razorpay_not_configured"
  | "live_keys_not_approved";

/** Why checkout can't run right now, or null when it can. */
export function checkoutBlockReason(): CheckoutBlockReason | null {
  if (!config.databaseUrl()) return "database_not_configured";
  const { keyId, keySecret, webhookSecret } = config.razorpay();
  if (!keyId || !keySecret || !webhookSecret) return "razorpay_not_configured";
  if (keyId.startsWith("rzp_live_") && !config.livePaymentsApproved()) return "live_keys_not_approved";
  return null;
}

export function razorpayMode(): "test" | "live" | "unset" {
  const keyId = config.razorpay().keyId;
  if (!keyId) return "unset";
  return keyId.startsWith("rzp_live_") ? "live" : "test";
}

/** Booleans only — safe to show on an admin/diagnostics page. */
export function integrationStatus() {
  const r = config.razorpay();
  const e = config.resend();
  const s = config.shiprocket();
  return {
    deployEnv: deployEnv(),
    database: Boolean(config.databaseUrl()),
    razorpay: {
      mode: razorpayMode(),
      keyId: Boolean(r.keyId),
      keySecret: Boolean(r.keySecret),
      webhookSecret: Boolean(r.webhookSecret),
      livePaymentsApproved: config.livePaymentsApproved(),
    },
    resend: { apiKey: Boolean(e.apiKey), from: Boolean(e.from), ownerEmail: Boolean(e.ownerEmail) },
    shiprocket: {
      email: Boolean(s.email),
      password: Boolean(s.password),
      pickupLocation: Boolean(s.pickupLocation),
      pickupPincode: Boolean(s.pickupPincode),
    },
    cronSecret: Boolean(config.cronSecret()),
    adminPassword: Boolean(config.adminPassword()),
    checkoutBlockReason: checkoutBlockReason(),
  };
}
