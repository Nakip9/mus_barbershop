import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StaffUser } from "@/lib/booking-types";
import { dataDirectory, readConfig } from "./config";
import { database, rateLimit } from "./database";
import { ApiError, clientKey, hash } from "./http";

type Account = StaffUser & { salt: string; passwordHash: string };
const COOKIE = "mus_staff";
const SESSION_SECONDS = 8 * 60 * 60;

function accounts(): Account[] {
  try {
    const value = JSON.parse(readFileSync(join(dataDirectory(), "staff.json"), "utf8"));
    if (!Array.isArray(value.users)) return [];
    const masterIds = new Set(readConfig().masters.map(m => m.id));
    return value.users.filter((u: Account) => typeof u.username === "string" && /^[a-z0-9_-]{2,40}$/.test(u.username) && typeof u.name === "string" && /^[a-f0-9]{32}$/.test(u.salt) && /^[a-f0-9]{128}$/.test(u.passwordHash) && (u.role === "admin" || (u.role === "master" && masterIds.has(u.masterId || ""))));
  } catch { return []; }
}

export function authConfigured() { return accounts().some(user => user.role === "admin"); }
function publicUser(account: Account): StaffUser {
  return { username: account.username, name: account.name, role: account.role, ...(account.masterId ? { masterId: account.masterId } : {}) };
}
function token(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
function credentialHash(account: Account) { return hash(account.username + account.salt + account.passwordHash); }
export function sessionUser(request: Request): StaffUser | null {
  const value = token(request);
  if (!value) return null;
  const db = database();
  db.prepare("DELETE FROM sessions WHERE expiresAt < ?").run(Date.now());
  const row = db.prepare("SELECT username, credentialHash FROM sessions WHERE tokenHash = ? AND expiresAt > ?").get(hash(value), Date.now()) as { username: string; credentialHash: string } | undefined;
  if (!row) return null;
  const account = accounts().find(user => user.username === row.username);
  return account && credentialHash(account) === row.credentialHash ? publicUser(account) : null;
}
export function requireStaff(request: Request) {
  const user = sessionUser(request);
  if (!user) throw new ApiError(401, "Войдите в кабинет, чтобы продолжить.");
  return user;
}
export function requireScope(user: StaffUser, masterId: string) {
  if (user.role !== "admin" && user.masterId !== masterId) throw new ApiError(403, "Доступно только ваше расписание.");
}
export function login(request: Request, username: string, password: string) {
  rateLimit("login-client:" + clientKey(request), 30, 15 * 60_000);
  rateLimit("login-account:" + username.toLowerCase(), 8, 15 * 60_000);
  const users = accounts();
  if (!users.length) throw new ApiError(503, "Доступ для команды пока не настроен.");
  const account = users.find(user => user.username === username.toLowerCase());
  const candidate = scryptSync(password, account?.salt || "00000000000000000000000000000000", 64);
  const expected = Buffer.from(account?.passwordHash || "0".repeat(128), "hex");
  if (!timingSafeEqual(candidate, expected) || !account) throw new ApiError(401, "Неверный логин или пароль.");
  const value = randomBytes(32).toString("base64url");
  const db = database();
  const previous = token(request);
  if (previous) db.prepare("DELETE FROM sessions WHERE tokenHash = ?").run(hash(previous));
  db.prepare("DELETE FROM sessions WHERE expiresAt < ?").run(Date.now());
  db.prepare("INSERT INTO sessions (tokenHash, username, credentialHash, expiresAt) VALUES (?, ?, ?, ?)").run(hash(value), account.username, credentialHash(account), Date.now() + SESSION_SECONDS * 1000);
  return { user: publicUser(account), cookie: cookie(value, SESSION_SECONDS) };
}
function cookie(value: string, maxAge: number) { return `${COOKIE}=${value}; Path=/api/staff; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
export function logout(request: Request) {
  const value = token(request);
  if (value) database().prepare("DELETE FROM sessions WHERE tokenHash = ?").run(hash(value));
  return cookie("", 0);
}
