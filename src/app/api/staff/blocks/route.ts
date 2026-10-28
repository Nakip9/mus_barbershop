import { requireStaff } from "@/lib/server/auth";
import { createBlock } from "@/lib/server/bookings";
import { fail, json, readBody, requireSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { requireSameOrigin(request); const user = requireStaff(request); return json({ block: createBlock(user, await readBody(request)) }, 201); } catch (error) { return fail(error); }
}
