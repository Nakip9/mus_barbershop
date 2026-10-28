import { catalog } from "@/lib/server/config";
import { effectiveMasters } from "@/lib/server/master-schedule";
import { fail, json } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() { try { return json({ ...catalog(), masters: effectiveMasters() }); } catch (error) { return fail(error); } }
