import { z } from "zod";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { moderateReview } from "@/lib/server/reviews";
import { json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(req.headers.get("authorization"))) return json({ error: "unauthorized" }, 401);
  const { id } = await params;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success || !/^\d+$/.test(id)) return json({ error: "invalid_input" }, 400);
  const found = await moderateReview(Number(id), parsed.data.action);
  return found ? json({ ok: true }) : json({ error: "not_found" }, 404);
}
