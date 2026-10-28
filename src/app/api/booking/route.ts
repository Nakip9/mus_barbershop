import { createBooking, receipt } from "@/lib/server/bookings";
import { isDemo } from "@/lib/server/config";
import { rateLimit } from "@/lib/server/database";
import { clientKey, fail, json, readBody, requireSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    rateLimit("public-requests:" + clientKey(request), 120, 5 * 60_000);
    const result = createBooking(await readBody(request), clientKey(request));
    return json({ booking: receipt(result.booking), demo: isDemo() }, result.created ? 201 : 200);
  } catch (error) { return fail(error); }
}
