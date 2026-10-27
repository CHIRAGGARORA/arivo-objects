import { getOrderByPublicToken } from "@/lib/server/orders";
import { isDbDown, json, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const order = await getOrderByPublicToken(token);
    if (!order) return json({ error: "not_found" }, 404);
    return json(order);
  } catch (err) {
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
