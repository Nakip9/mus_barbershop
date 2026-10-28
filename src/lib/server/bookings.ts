import { randomBytes, randomUUID } from "node:crypto";
import type { BookingRecord, BookingReceipt, BookingStatus, ScheduleBlock, StaffUser } from "@/lib/booking-types";
import { bookingDate, bookableMaster, clockTime, minuteOfDay, readConfig, requireBookingOpen, scheduleDate, SLOT_STEP } from "./config";
import { database, overlaps, rateLimit, transaction } from "./database";
import { ApiError, hash, stringField } from "./http";
import { requireScope } from "./auth";
import { effectiveMasters } from "./master-schedule";

type StoredBooking = BookingRecord & { requestId: string; requestHash: string; startMinute: number; endMinute: number };
const PUBLIC_FIELDS = "id, reference, serviceId, masterId, serviceName, masterName, date, time, endTime, price, name, phone, status, createdAt";
export function receipt(row: BookingRecord): BookingReceipt {
  return { reference: row.reference, serviceName: row.serviceName, masterName: row.masterName, date: row.date, time: row.time, endTime: row.endTime, price: row.price, status: row.status };
}
function selection(serviceId: string, masterId: string) {
  const config = requireBookingOpen();
  const service = config.services.find(item => item.id === serviceId);
  const master = effectiveMasters().find(item => item.id === masterId);
  if (!service || !master) throw new ApiError(400, "Выберите услугу и мастера из списка.");
  return { service, master };
}
export function availableSlots(date: string, serviceId: string, masterId: string) {
  bookingDate(date);
  const { service, master } = selection(serviceId, masterId);
  const db = database();
  const slots: { time: string; masterId: string }[] = [];
  for (let start = minuteOfDay(master.startTime); start + service.durationMinutes <= minuteOfDay(master.endTime); start += SLOT_STEP) {
    const end = start + service.durationMinutes;
    if (bookableMaster(master, date, start, end) && !overlaps(db, masterId, date, start, end)) slots.push({ time: clockTime(start), masterId });
  }
  return { slots, date };
}
export function createBooking(body: Record<string, unknown>, client: string) {
  const serviceId = stringField(body, "serviceId", 40), masterId = stringField(body, "masterId", 40);
  const date = bookingDate(stringField(body, "date", 10)), time = stringField(body, "time", 5);
  const name = stringField(body, "name", 80), rawPhone = stringField(body, "phone", 22);
  const requestId = stringField(body, "requestId", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new ApiError(400, "Обновите страницу и повторите запись.");
  if (name.length < 2 || !/\p{L}/u.test(name) || /[\x00-\x1F<>]/.test(name)) throw new ApiError(400, "Укажите ваше имя (от 2 до 80 символов).");
  if (!/^[+\d\s()\-]+$/.test(rawPhone)) throw new ApiError(400, "Укажите российский номер телефона.");
  const digits = rawPhone.replace(/\D/g, "");
  if (!/^[78]\d{10}$/.test(digits)) throw new ApiError(400, "Укажите российский номер: +7 и 10 цифр.");
  const phone = "+7" + digits.slice(1);
  if (body.consent !== true || (body.website !== undefined && body.website !== "")) throw new ApiError(400, "Проверьте форму и согласие на обработку данных.");
  const { service, master } = selection(serviceId, masterId);
  const start = minuteOfDay(time), end = start + service.durationMinutes;
  const requestHash = hash(JSON.stringify({ serviceId, masterId, date, time, name, phone }));
  return transaction(db => {
    const existing = db.prepare("SELECT * FROM bookings WHERE requestId = ?").get(requestId) as StoredBooking | undefined;
    if (existing) {
      if (existing.requestHash !== requestHash) throw new ApiError(409, "Форма изменилась. Обновите страницу и повторите запись.");
      return { booking: existing, created: false };
    }
    if (!bookableMaster(master, date, start, end)) throw new ApiError(400, "Это время недоступно. Выберите другой вариант.");
    if (overlaps(db, masterId, date, start, end)) throw new ApiError(409, "Это время уже занято. Выберите другое свободное время.");
    rateLimit("booking-client:" + client, 60, 60 * 60_000);
    rateLimit("booking-phone:" + phone, 6, 60 * 60_000);
    const booking: BookingRecord = { id: randomUUID(), reference: "МУС-" + randomBytes(5).toString("hex").toUpperCase(), serviceId, masterId, serviceName: service.name, masterName: master.name, date, time, endTime: clockTime(end), price: service.prices[master.priceIndex], name, phone, status: "confirmed", createdAt: new Date().toISOString() };
    db.prepare(`INSERT INTO bookings (id,requestId,requestHash,reference,serviceId,masterId,serviceName,masterName,date,time,endTime,startMinute,endMinute,price,name,phone,status,createdAt,notificationStatus,consentVersion)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(booking.id, requestId, requestHash, booking.reference, serviceId, masterId, service.name, master.name, date, time, booking.endTime, start, end, booking.price, name, phone, booking.status, booking.createdAt, "disabled", "2026-10-26");
    return { booking, created: true };
  });
}
export function schedule(user: StaffUser, date: string, filter: string) {
  scheduleDate(date);
  const config = { ...readConfig(), masters: effectiveMasters() };
  const masterId = filter || (user.role === "master" ? user.masterId! : "");
  if (masterId) {
    requireScope(user, masterId);
    if (!config.masters.some(m => m.id === masterId)) throw new ApiError(400, "Мастер не найден.");
  }
  const db = database();
  const clause = masterId ? " AND masterId = ?" : "";
  const values = masterId ? [date, masterId] : [date];
  const bookings = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM bookings WHERE date = ?${clause} ORDER BY time, masterId`).all(...values) as BookingRecord[];
  const blocks = db.prepare(`SELECT id,masterId,date,startTime,endTime,note FROM blocks WHERE date = ?${clause} ORDER BY startTime`).all(...values) as ScheduleBlock[];
  return { bookings, blocks, masters: config.masters.filter(m => user.role === "admin" || m.id === user.masterId), user };
}
export function changeStatus(user: StaffUser, id: string, status: unknown) {
  if (!["confirmed", "completed", "cancelled"].includes(String(status))) throw new ApiError(400, "Некорректный статус.");
  return transaction(db => {
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as StoredBooking | undefined;
    if (!booking) throw new ApiError(404, "Запись не найдена.");
    requireScope(user, booking.masterId);
    if (status !== "cancelled" && booking.status === "cancelled" && overlaps(db, booking.masterId, booking.date, booking.startMinute, booking.endMinute, id)) throw new ApiError(409, "Время уже занято. Восстановить запись нельзя.");
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status as string, id);
    return { ...receipt(booking), status: status as BookingStatus };
  });
}
export function createBlock(user: StaffUser, body: Record<string, unknown>) {
  const masterId = stringField(body, "masterId", 40), date = scheduleDate(stringField(body, "date", 10));
  requireScope(user, masterId);
  const master = effectiveMasters().find(m => m.id === masterId);
  if (!master) throw new ApiError(400, "Мастер не найден.");
  const startTime = stringField(body, "startTime", 5), endTime = stringField(body, "endTime", 5), note = stringField(body, "note", 120);
  const start = minuteOfDay(startTime), end = minuteOfDay(endTime);
  if (start >= end || start % SLOT_STEP || end % SLOT_STEP || start < minuteOfDay(master.startTime) || end > minuteOfDay(master.endTime) || /[\x00-\x1F]/.test(note)) throw new ApiError(400, "Выберите время в пределах смены с шагом 15 минут.");
  return transaction(db => {
    if (overlaps(db, masterId, date, start, end)) throw new ApiError(409, "В этот промежуток уже есть запись или перерыв.");
    const block: ScheduleBlock = { id: randomUUID(), masterId, date, startTime, endTime, note };
    db.prepare("INSERT INTO blocks (id,masterId,date,startTime,endTime,startMinute,endMinute,note,createdBy) VALUES (?,?,?,?,?,?,?,?,?)").run(block.id, masterId, date, startTime, endTime, start, end, note, user.username);
    return block;
  });
}
export function removeBlock(user: StaffUser, id: string) {
  const db = database();
  const block = db.prepare("SELECT masterId FROM blocks WHERE id = ?").get(id) as {masterId: string} | undefined;
  if (!block) throw new ApiError(404, "Перерыв не найден.");
  requireScope(user, block.masterId);
  db.prepare("DELETE FROM blocks WHERE id = ?").run(id);
}
