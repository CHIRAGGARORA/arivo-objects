import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { processOrderTasks } from "@/lib/server/tasks";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(req.headers.get("authorization"))) return json({ error: "unauthorized" }, 401);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return json({ error: "invalid_id" }, 400);
  const report = await processOrderTasks(id, { force: true });
  return json({ ok: true, report });
}
