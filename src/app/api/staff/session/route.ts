import { authConfigured, logout, sessionUser } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/config";
import { fail, json, requireSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  try { return json({ user: sessionUser(request), configured: authConfigured(), demo: isDemo() }); } catch (error) { return fail(error); }
}
export function DELETE(request: Request) {
  try { requireSameOrigin(request); return json({ ok: true }, 200, { "Set-Cookie": logout(request) }); } catch (error) { return fail(error); }
}
