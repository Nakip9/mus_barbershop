import { login } from "@/lib/server/auth";
import { fail, json, readBody, requireSameOrigin, stringField } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readBody(request);
    const result = login(request, stringField(body, "username", 40), stringField(body, "password", 256));
    return json({ user: result.user }, 200, { "Set-Cookie": result.cookie });
  } catch (error) { return fail(error); }
}
