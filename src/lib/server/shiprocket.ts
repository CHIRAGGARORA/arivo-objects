import "server-only";
import { config, deployEnv } from "./config";
import { getPackedSpec, isCompleteSpec } from "@/lib/shipping-specs";

/**
 * Shiprocket integration.
 *
 * Every paid order is created in Shiprocket. When SHIPROCKET_AUTO_SHIP=true
 * the courier is also assigned (by the courier priority set in the Shiprocket
 * dashboard) and a pickup is requested. Auto-ship never runs on preview/test
 * deployments, so test orders can't book real couriers.
 */

const API = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketError extends Error {
  constructor(
    message: string,
    /** false = retrying won't help (bad data / missing config); needs a human. */
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "ShiprocketError";
  }
}

export function shiprocketConfigured(): boolean {
  const s = config.shiprocket();
  return Boolean(s.email && s.password && s.pickupLocation);
}

/** Owner opted in to automatic courier assignment + pickup (production only). */
export function autoShipEnabled(): boolean {
  return config.shiprocket().autoShip && deployEnv() !== "preview";
}

let cachedToken: { token: string; expiresAt: number; email: string } | null = null;

/** Test helper. */
export function resetShiprocketToken() {
  cachedToken = null;
}

async function token(): Promise<string> {
  const { email, password } = config.shiprocket();
  if (!email || !password) throw new ShiprocketError("Shiprocket API user is not configured", false);
  if (cachedToken && cachedToken.email === email && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  let res: Response;
  try {
    res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new ShiprocketError(`Shiprocket login request failed: ${(err as Error).message}`, true);
  }
  if (!res.ok) {
    throw new ShiprocketError(
      `Shiprocket login failed (${res.status}). Check the API user email/password in Vercel settings.`,
      res.status >= 500 || res.status === 429
    );
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new ShiprocketError("Shiprocket login returned no token", true);
  // Tokens are valid for 10 days; refresh well before that.
  cachedToken = { token: body.token, expiresAt: Date.now() + 8 * 24 * 3600 * 1000, email };
  return body.token;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new ShiprocketError(`Shiprocket request failed: ${(err as Error).message}`, true);
  }
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) cachedToken = null;
    throw new ShiprocketError(
      `Shiprocket ${path.split("?")[0]} failed (${res.status}): ${text.slice(0, 300)}`,
      res.status >= 500 || res.status === 429 || res.status === 401
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ShiprocketError(`Shiprocket returned non-JSON from ${path.split("?")[0]}`, true);
  }
}

/**
 * Returns true/false when Shiprocket gives a definite answer, or null when
 * it can't be checked (not configured / API error) — callers must not block
 * checkout on null.
 */
export async function isPincodeServiceable(deliveryPincode: string, weightKg = 0.5): Promise<boolean | null> {
  const { pickupPincode } = config.shiprocket();
  if (!shiprocketConfigured() || !pickupPincode) return null;
  try {
    const qs = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weightKg),
      cod: "0",
    });
    const r = await call<{ status?: number; data?: { available_courier_companies?: unknown[] } }>(
      "GET",
      `/courier/serviceability/?${qs}`
    );
    return (r.data?.available_courier_companies?.length ?? 0) > 0;
  } catch (err) {
    // Shiprocket answers 404 when no courier serves the pincode.
    if (err instanceof ShiprocketError && /\(404\)/.test(err.message)) return false;
    return null;
  }
}

export interface ShipmentOrderInput {
  orderNumber: string;
  createdAt: Date;
  customer: { name: string; email: string; phone: string };
  address: { line1: string; line2?: string | null; city: string; state: string; pincode: string };
  items: { productSlug: string; variantId: string; name: string; variantLabel: string; quantity: number; unitPricePaise: number }[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
}

export interface ShipmentResult {
  shiprocketOrderId: number;
  shipmentId: number | null;
  status: string | null;
  awbCode: string | null;
  courierName: string | null;
  reusedExisting: boolean;
  pickupScheduledDate?: string | null;
  note?: string;
}

/** Package size/weight from packed specs. Throws (non-retryable) if any are missing. */
export function packageFor(items: ShipmentOrderInput["items"]) {
  const missing: string[] = [];
  let weightKg = 0;
  let lengthCm = 0;
  let breadthCm = 0;
  let heightCm = 0;
  let units = 0;
  for (const item of items) {
    const spec = getPackedSpec(item.productSlug, item.variantId);
    if (!isCompleteSpec(spec)) {
      missing.push(`${item.name} (${item.variantLabel})`);
      continue;
    }
    units += item.quantity;
    weightKg += spec.weightKg * item.quantity;
    lengthCm = Math.max(lengthCm, spec.lengthCm);
    breadthCm = Math.max(breadthCm, spec.breadthCm);
    heightCm += spec.heightCm * item.quantity;
  }
  if (missing.length) {
    throw new ShiprocketError(
      `Packed weight/dimensions not recorded for: ${missing.join(", ")}. Add them to src/lib/shipping-specs.ts, or create this order manually in Shiprocket.`,
      false
    );
  }
  return {
    weightKg: Math.round(weightKg * 1000) / 1000,
    lengthCm,
    breadthCm,
    heightCm,
    note:
      units > 1
        ? "Multiple units: package size was estimated by stacking individual packed boxes. Check weight and dimensions in Shiprocket before choosing a courier."
        : undefined,
  };
}

interface ShiprocketOrderListItem {
  id: number;
  channel_order_id: string;
  status?: string;
  shipments?: { id: number; awb?: string | null; courier?: string | null }[];
}

async function findExisting(orderNumber: string): Promise<ShipmentResult | null> {
  const r = await call<{ data?: ShiprocketOrderListItem[] }>(
    "GET",
    `/orders?search=${encodeURIComponent(orderNumber)}&per_page=10`
  );
  const match = r.data?.find((o) => o.channel_order_id === orderNumber);
  if (!match) return null;
  const shipment = match.shipments?.[0];
  return {
    shiprocketOrderId: match.id,
    shipmentId: shipment?.id ?? null,
    status: match.status ?? null,
    awbCode: shipment?.awb || null,
    courierName: shipment?.courier || null,
    reusedExisting: true,
  };
}

function formatOrderDate(d: Date): string {
  // Shiprocket expects "YYYY-MM-DD HH:mm" in IST.
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().slice(0, 16).replace("T", " ");
}

export async function createShipmentOrder(input: ShipmentOrderInput): Promise<ShipmentResult> {
  const { pickupLocation } = config.shiprocket();
  if (!shiprocketConfigured() || !pickupLocation) {
    throw new ShiprocketError("Shiprocket is not set up yet (no API user / pickup location configured), so this order must be shipped manually.", false);
  }
  const pkg = packageFor(input.items);

  // Idempotency: if a previous attempt reached Shiprocket but we never
  // recorded the response, reuse that order instead of creating another.
  const existing = await findExisting(input.orderNumber);
  const order = existing ?? (await createAdhoc(input, pickupLocation, pkg));
  return autoShipEnabled() ? dispatch(order) : order;
}

async function createAdhoc(
  input: ShipmentOrderInput,
  pickupLocation: string,
  pkg: ReturnType<typeof packageFor>
): Promise<ShipmentResult> {
  const [first, ...rest] = input.customer.name.trim().split(/\s+/);
  const r = await call<{
    order_id?: number;
    shipment_id?: number;
    status?: string;
    awb_code?: string;
    courier_name?: string;
    message?: string;
  }>("POST", "/orders/create/adhoc", {
    order_id: input.orderNumber,
    order_date: formatOrderDate(input.createdAt),
    pickup_location: pickupLocation,
    billing_customer_name: first,
    billing_last_name: rest.join(" ") || "",
    billing_address: input.address.line1,
    billing_address_2: input.address.line2 ?? "",
    billing_city: input.address.city,
    billing_pincode: input.address.pincode,
    billing_state: input.address.state,
    billing_country: "India",
    billing_email: input.customer.email,
    billing_phone: input.customer.phone,
    shipping_is_billing: true,
    order_items: input.items.map((i) => ({
      name: `${i.name} — ${i.variantLabel}`,
      sku: `${i.productSlug}/${i.variantId}`,
      units: i.quantity,
      selling_price: i.unitPricePaise / 100,
    })),
    payment_method: "Prepaid",
    shipping_charges: input.shippingPaise / 100,
    sub_total: input.subtotalPaise / 100,
    total_discount: input.discountPaise / 100,
    length: pkg.lengthCm,
    breadth: pkg.breadthCm,
    height: pkg.heightCm,
    weight: pkg.weightKg,
  });
  if (!r.order_id) {
    throw new ShiprocketError(`Shiprocket did not create the order: ${(r.message ?? "no order_id returned").slice(0, 300)}`, false);
  }
  return {
    shiprocketOrderId: r.order_id,
    shipmentId: r.shipment_id ?? null,
    status: r.status ?? null,
    awbCode: r.awb_code || null,
    courierName: r.courier_name || null,
    reusedExisting: false,
    note: pkg.note,
  };
}

/**
 * Assigns a courier (AWB) and requests pickup. Safe to repeat: an AWB already
 * on the shipment is reused, and "already in pickup queue" counts as done.
 */
async function dispatch(order: ShipmentResult): Promise<ShipmentResult> {
  if (!order.shipmentId) {
    throw new ShiprocketError(
      `Shiprocket order ${order.shiprocketOrderId} has no shipment, so no courier could be booked. Ship it from the Shiprocket dashboard.`,
      false
    );
  }
  let { awbCode, courierName } = order;
  if (!awbCode) {
    const r = await call<{
      awb_assign_status?: number;
      message?: string;
      response?: { data?: { awb_code?: string; courier_name?: string; awb_assign_error?: string } };
    }>("POST", "/courier/assign/awb", { shipment_id: order.shipmentId });
    const d = r.response?.data;
    if (r.awb_assign_status !== 1 || !d?.awb_code) {
      throw new ShiprocketError(
        `Shiprocket order ${order.shiprocketOrderId} was created, but no courier could be assigned: ${(d?.awb_assign_error ?? r.message ?? "no reason given").slice(0, 300)}. Check the Shiprocket wallet balance and courier settings, then press Retry in /admin or ship it from the Shiprocket dashboard.`,
        false
      );
    }
    awbCode = d.awb_code;
    courierName = d.courier_name ?? null;
  }

  let pickupScheduledDate: string | null = null;
  try {
    const r = await call<{ pickup_status?: number; message?: string; response?: { pickup_scheduled_date?: string } }>(
      "POST",
      "/courier/generate/pickup",
      { shipment_id: [order.shipmentId] }
    );
    if (r.pickup_status !== 1 && !/already/i.test(r.message ?? "")) {
      throw new ShiprocketError(`Courier ${courierName ?? ""} (AWB ${awbCode}) assigned, but the pickup request failed: ${(r.message ?? "no reason given").slice(0, 300)}`, true);
    }
    pickupScheduledDate = r.response?.pickup_scheduled_date ?? null;
  } catch (err) {
    if (!(err instanceof ShiprocketError && /already/i.test(err.message))) throw err;
  }
  return { ...order, awbCode, courierName, pickupScheduledDate };
}

/** Read-only: pickup location names saved in Shiprocket (for config checks). */
export async function listPickupLocations(): Promise<string[]> {
  const r = await call<{ data?: { shipping_address?: { pickup_location?: string }[] } }>(
    "GET",
    "/settings/company/pickup"
  );
  return (r.data?.shipping_address ?? []).map((a) => a.pickup_location ?? "").filter(Boolean);
}
