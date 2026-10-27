import { checkoutSchema, fieldErrors } from "@/lib/server/validation";
import { checkoutBlockReason, config } from "@/lib/server/config";
import { CartError } from "@/lib/server/catalog";
import { createOrder, OrderError } from "@/lib/server/orders";
import { isPincodeServiceable } from "@/lib/server/shiprocket";
import { isDbDown, json, rateLimited, readJson, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (checkoutBlockReason()) {
    return json({ error: "checkout_unavailable", message: "Online checkout is not available yet." }, 503);
  }

  const parsed = checkoutSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ error: "invalid_input", message: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);
  }

  try {
    if (await rateLimited(req, "checkout", 20, 600)) {
      return json({ error: "rate_limited", message: "Too many attempts. Please wait a few minutes." }, 429);
    }

    const serviceable = await isPincodeServiceable(parsed.data.address.pincode);
    if (serviceable === false) {
      return json(
        {
          error: "pincode_not_serviceable",
          message: "Sorry, we can't deliver to this PIN code yet.",
          fields: { "address.pincode": "We can't deliver to this PIN code yet" },
        },
        400
      );
    }

    const order = await createOrder(parsed.data);
    return json({
      ...order,
      keyId: config.razorpay().keyId, // public key id only
      prefill: {
        name: parsed.data.customer.name,
        email: parsed.data.customer.email,
        contact: parsed.data.customer.phone,
      },
    });
  } catch (err) {
    if (err instanceof CartError) {
      return json({ error: err.code, message: err.message, item: err.item }, err.code === "shipping_fee_not_configured" ? 503 : 400);
    }
    if (err instanceof OrderError) {
      return json({ error: err.code, message: err.message }, err.code === "request_conflict" ? 409 : 502);
    }
    if (isDbDown(err)) return serviceUnavailable();
    console.error("[checkout/create] unexpected error:", (err as Error).message);
    return json({ error: "server_error", message: "Something went wrong. Please try again." }, 500);
  }
}
