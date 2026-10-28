import { requireStaff } from "@/lib/server/auth";
import { schedule } from "@/lib/server/bookings";
import { isDemo } from "@/lib/server/config";
import { fail, json } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  try { const user = requireStaff(request), params = new URL(request.url).searchParams; return json({ ...schedule(user, params.get("date") || "", params.get("masterId") || ""), demo: isDemo() }); } catch (error) { return fail(error); }
}
