import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { dataDirectory, isDemo } from "./config";
import { ApiError, hash } from "./http";

const state = globalThis as typeof globalThis & { musDatabases?: Map<string, DatabaseSync> };

export function database() {
  const directory = dataDirectory();
  const path = join(directory, isDemo() ? "bookings-demo.sqlite" : "bookings.sqlite");
  state.musDatabases ??= new Map();
  const existing = state.musDatabases.get(path);
  if (existing) return existing;
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, requestId TEXT NOT NULL UNIQUE, requestHash TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE, serviceId TEXT NOT NULL, masterId TEXT NOT NULL,
      serviceName TEXT NOT NULL, masterName TEXT NOT NULL, date TEXT NOT NULL,
      time TEXT NOT NULL, endTime TEXT NOT NULL, startMinute INTEGER NOT NULL,
      endMinute INTEGER NOT NULL, price INTEGER NOT NULL, name TEXT NOT NULL,
      phone TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('confirmed', 'completed', 'cancelled')),
      createdAt TEXT NOT NULL, notificationStatus TEXT NOT NULL, consentVersion TEXT NOT NULL,
      notificationUpdatedAt INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS booking_schedule ON bookings(masterId, date, status, startMinute, endMinute);
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY, masterId TEXT NOT NULL, date TEXT NOT NULL,
      startTime TEXT NOT NULL, endTime TEXT NOT NULL, startMinute INTEGER NOT NULL,
      endMinute INTEGER NOT NULL, note TEXT NOT NULL, createdBy TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS block_schedule ON blocks(masterId, date, startMinute, endMinute);
    CREATE TABLE IF NOT EXISTS master_schedule (
      masterId TEXT PRIMARY KEY, workDays TEXT NOT NULL, startTime TEXT NOT NULL,
      endTime TEXT NOT NULL, updatedBy TEXT NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      tokenHash TEXT PRIMARY KEY, username TEXT NOT NULL, credentialHash TEXT NOT NULL, expiresAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expiresAt INTEGER NOT NULL
    );
  `);
  if (process.platform !== "win32") chmodSync(path, 0o600);
  state.musDatabases.set(path, db);
  return db;
}

export function transaction<T>(operation: (db: DatabaseSync) => T) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const db = database();
  const now = Date.now();
  db.prepare("DELETE FROM rate_limits WHERE expiresAt < ?").run(now);
  const bucket = hash(key + ":" + Math.floor(now / windowMs));
  const result = db.prepare(`INSERT INTO rate_limits (key, attempts, expiresAt) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts`).get(bucket, now + windowMs) as { attempts: number };
  if (result.attempts > limit) throw new ApiError(429, "Слишком много попыток. Подождите немного и попробуйте снова.");
}

export function overlaps(db: DatabaseSync, masterId: string, date: string, start: number, end: number, excludeId = "") {
  const booking = db.prepare("SELECT id FROM bookings WHERE masterId = ? AND date = ? AND status != 'cancelled' AND startMinute < ? AND endMinute > ? AND id != ? LIMIT 1").get(masterId, date, end, start, excludeId);
  const block = db.prepare("SELECT id FROM blocks WHERE masterId = ? AND date = ? AND startMinute < ? AND endMinute > ? LIMIT 1").get(masterId, date, end, start);
  return Boolean(booking || block);
}
