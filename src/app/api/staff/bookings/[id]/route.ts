import { requireStaff } from "@/lib/server/auth";
import { changeStatus } from "@/lib/server/bookings";
import { fail, json, readBody, requireSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { requireSameOrigin(request); const user = requireStaff(request); const body = await readBody(request); const { id } = await context.params; return json({ booking: changeStatus(user, id, body.status) }); } catch (error) { return fail(error); }
}
