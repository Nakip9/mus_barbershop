import { requireStaff } from "@/lib/server/auth";
import { removeBlock } from "@/lib/server/bookings";
import { fail, json, requireSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { requireSameOrigin(request); const user = requireStaff(request); const { id } = await context.params; removeBlock(user, id); return json({ ok: true }); } catch (error) { return fail(error); }
}
