import { z } from "zod";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { markShipped, resolveAttention } from "@/lib/server/orders";
import { json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["shipped", "resolve"]) });

/** Owner actions on one order: mark it shipped, or clear its warning. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(req.headers.get("authorization"))) return json({ error: "unauthorized" }, 401);
  const { id } = await params;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success || !/^\d+$/.test(id)) return json({ error: "invalid_input" }, 400);
  const changed = parsed.data.action === "shipped" ? await markShipped(id) : await resolveAttention(id);
  return changed ? json({ ok: true }) : json({ error: "not_applicable" }, 409);
}
