import { availableSlots } from "@/lib/server/bookings";
import { fail, json } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  try { const p = new URL(request.url).searchParams; return json(availableSlots(p.get("date") || "", p.get("serviceId") || "", p.get("masterId") || "")); } catch (error) { return fail(error); }
}
