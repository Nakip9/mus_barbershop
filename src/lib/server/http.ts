import { createHash } from "node:crypto";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  // Internal exceptions can contain credentials or customer data. Never return or log them.
  return json({ error: "Не удалось выполнить запрос. Попробуйте ещё раз немного позже." }, 500);
}

export function requireSameOrigin(request: Request) {
  const received = request.headers.get("origin");
  const target = new URL(request.url);
  let allowed: string;
  if (process.env.NODE_ENV === "production") {
    const configured = process.env.APP_ORIGIN;
    if (!configured) throw new ApiError(503, "Администратору нужно настроить адрес сайта.");
    let canonical: URL;
    try { canonical = new URL(configured); } catch { throw new ApiError(503, "Некорректный адрес сайта."); }
    if (canonical.protocol !== "https:" || canonical.origin !== configured || canonical.username || canonical.password) {
      throw new ApiError(503, "Для работы портала нужен корректный HTTPS-адрес сайта.");
    }
    allowed = canonical.origin;
  } else {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
      throw new ApiError(403, "Этот адрес сайта не разрешён.");
    }
    allowed = target.origin;
  }
  if (received !== allowed || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "Обновите страницу сайта и повторите действие.");
  }
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "Требуется JSON-запрос.");
  }
  const limit = 8192;
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > limit) throw new ApiError(413, "Запрос слишком большой.");
  if (!request.body) throw new ApiError(400, "Заполните поля формы.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, "Запрос слишком большой.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "Не удалось прочитать форму. Обновите страницу."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Некорректная форма.");
  return body as Record<string, unknown>;
}

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function clientKey(request: Request) {
  // Enable only behind a reverse proxy which replaces (rather than appends) this header.
  if (process.env.TRUST_PROXY === "true") {
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (address && /^[a-fA-F0-9:.]{3,64}$/.test(address)) return hash(address);
  }
  return "shared-direct-connection";
}

export function stringField(body: Record<string, unknown>, key: string, max = 100) {
  const value = body[key];
  if (typeof value !== "string" || value.length > max) throw new ApiError(400, "Проверьте заполнение формы.");
  return value.trim();
}
