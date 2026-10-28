import { requireStaff } from "@/lib/server/auth";
import { effectiveMasters, saveMasterSchedule } from "@/lib/server/master-schedule";
import { fail, json, readBody, requireSameOrigin } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireStaff(request);
    return json({ masters: effectiveMasters().filter(master => user.role === "admin" || master.id === user.masterId) });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const user = requireStaff(request);
    return json({ master: saveMasterSchedule(user, await readBody(request)) });
  } catch (error) { return fail(error); }
}
