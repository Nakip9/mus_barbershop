import type { BookingMaster } from "@/lib/booking-types";
import { readConfig, minuteOfDay, SLOT_STEP, today } from "./config";
import { database, transaction } from "./database";
import { ApiError } from "./http";
import { requireScope } from "./auth";
import type { StaffUser } from "@/lib/booking-types";

type OverrideRow = { masterId: string; workDays: string; startTime: string; endTime: string };

export function effectiveMasters(): BookingMaster[] {
  const base = readConfig();
  const overrides = new Map((database().prepare("SELECT masterId,workDays,startTime,endTime FROM master_schedule").all() as OverrideRow[]).map(row => [row.masterId, row]));
  return base.masters.map(master => {
    const row = overrides.get(master.id);
    if (!row) return master;
    try {
      const workDays = JSON.parse(row.workDays) as number[];
      return { ...master, workDays, startTime: row.startTime, endTime: row.endTime };
    } catch { return master; }
  });
}

export function saveMasterSchedule(user: StaffUser, body: Record<string, unknown>) {
  const masterId = String(body.masterId || "");
  requireScope(user, masterId);
  const master = readConfig().masters.find(item => item.id === masterId);
  if (!master) throw new ApiError(400, "Мастер не найден.");
  const rawDays = body.workDays;
  if (!Array.isArray(rawDays) || rawDays.length < 1 || rawDays.length > 7 || rawDays.some(day => !Number.isInteger(day) || Number(day) < 0 || Number(day) > 6) || new Set(rawDays).size !== rawDays.length) throw new ApiError(400, "Выберите рабочие дни.");
  const workDays = [...rawDays].map(Number).sort((a, b) => a - b);
  const startTime = String(body.startTime || ""), endTime = String(body.endTime || "");
  const start = minuteOfDay(startTime), end = minuteOfDay(endTime);
  if (start >= end || start % SLOT_STEP || end % SLOT_STEP) throw new ApiError(400, "Укажите смену с шагом 15 минут.");
  transaction(db => {
    const upcoming = db.prepare("SELECT date,startMinute,endMinute FROM bookings WHERE masterId = ? AND date >= ? AND status = 'confirmed'").all(masterId, today()) as { date: string; startMinute: number; endMinute: number }[];
    if (upcoming.some(booking => !workDays.includes(new Date(booking.date + 'T12:00:00Z').getUTCDay()) || booking.startMinute < start || booking.endMinute > end)) {
      throw new ApiError(409, "Новый график пересекается с существующими записями. Сначала согласуйте изменения с клиентами и отмените затронутые записи.");
    }
    db.prepare(`INSERT INTO master_schedule (masterId,workDays,startTime,endTime,updatedBy,updatedAt) VALUES (?,?,?,?,?,?)
    ON CONFLICT(masterId) DO UPDATE SET workDays=excluded.workDays,startTime=excluded.startTime,endTime=excluded.endTime,updatedBy=excluded.updatedBy,updatedAt=excluded.updatedAt`)
    .run(masterId, JSON.stringify(workDays), startTime, endTime, user.username, Date.now());
  });
  return effectiveMasters().find(item => item.id === masterId)!;
}
