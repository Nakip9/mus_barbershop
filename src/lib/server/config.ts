import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BookingCatalog, BookingMaster, BookingService } from "@/lib/booking-types";
import { ApiError } from "./http";

type BookingConfig = { demo: boolean; timeZone: string; services: BookingService[]; masters: BookingMaster[] };

export const TIME_ZONE = "Asia/Yekaterinburg";
export const HORIZON_DAYS = 30;
export const LEAD_MINUTES = 30;
export const SLOT_STEP = 15;

export function isDemo() { return process.env.BOOKING_LIVE !== "true"; }
export function dataDirectory() { return resolve(process.env.BOOKING_DATA_DIR || resolve(process.cwd(), ".local")); }

export function minuteOfDay(value: string) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new ApiError(400, "Выберите корректное время.");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function clockTime(minutes: number) {
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}

export function readConfig(): BookingConfig {
  try {
    const config = JSON.parse(readFileSync(resolve(process.env.BOOKING_CONFIG_PATH || resolve(process.cwd(), "config/booking.json")), "utf8").replace(/^\uFEFF/, "")) as BookingConfig;
    const id = /^[a-z0-9][a-z0-9-]{0,39}$/;
    if (typeof config.demo !== "boolean" || config.timeZone !== TIME_ZONE || !Array.isArray(config.services) || !Array.isArray(config.masters) || config.services.length < 1 || config.services.length > 30 || config.masters.length < 1 || config.masters.length > 30) throw new Error();
    const services = new Set<string>();
    for (const service of config.services) {
      if (!id.test(service.id) || services.has(service.id) || typeof service.name !== "string" || !service.name.trim() || service.name.length > 100 || !Number.isInteger(service.durationMinutes) || service.durationMinutes < 15 || service.durationMinutes > 240 || service.durationMinutes % SLOT_STEP !== 0 || !Array.isArray(service.prices) || service.prices.length < 1 || service.prices.some(price => !Number.isInteger(price) || price < 0 || price > 100000)) throw new Error();
      services.add(service.id);
    }
    const masters = new Set<string>();
    for (const master of config.masters) {
      if (!id.test(master.id) || masters.has(master.id) || typeof master.name !== "string" || !master.name.trim() || master.name.length > 80 || typeof master.category !== "string" || master.category.length > 80 || !Number.isInteger(master.priceIndex) || master.priceIndex < 0 || config.services.some(service => master.priceIndex >= service.prices.length) || !Array.isArray(master.workDays) || master.workDays.length > 7 || master.workDays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(master.workDays).size !== master.workDays.length || minuteOfDay(master.startTime) >= minuteOfDay(master.endTime) || minuteOfDay(master.startTime) % SLOT_STEP !== 0 || minuteOfDay(master.endTime) % SLOT_STEP !== 0) throw new Error();
      masters.add(master.id);
    }
    return config;
  } catch { throw new ApiError(503, "Расписание временно недоступно. Свяжитесь с барбершопом."); }
}

export function today() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
}

export function addDays(date: string, days: number) {
  const instant = new Date(date + "T12:00:00Z");
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, "Выберите корректную дату.");
  const instant = new Date(value + "T12:00:00Z");
  if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 10) !== value) throw new ApiError(400, "Выберите корректную дату.");
  return value;
}

export function bookingDate(value: string) {
  validDate(value);
  const firstDay = today();
  if (value < firstDay || value > addDays(firstDay, HORIZON_DAYS)) throw new ApiError(400, "Запись открыта на ближайшие 30 дней.");
  return value;
}

export function scheduleDate(value: string) {
  validDate(value);
  const firstDay = today();
  if (value < addDays(firstDay, -365) || value > addDays(firstDay, 365)) throw new ApiError(400, "Выберите дату в пределах года.");
  return value;
}

export function slotInstant(date: string, time: string) {
  // Chelyabinsk observes UTC+05:00 year-round; all stored dates/times belong to this zone.
  return new Date(date + "T" + time + ":00+05:00").getTime();
}

export function bookableMaster(master: BookingMaster, date: string, start: number, end: number) {
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  return master.workDays.includes(weekday) && start >= minuteOfDay(master.startTime) && end <= minuteOfDay(master.endTime) && start % SLOT_STEP === 0 && slotInstant(date, clockTime(start)) >= Date.now() + LEAD_MINUTES * 60_000;
}

export function catalog(): BookingCatalog {
  const config = readConfig();
  const demo = isDemo();
  const day = today();
  const hasDemoNames = config.masters.some(master => /демо|demo|example|тест|test/i.test(master.name));
  return { services: config.services, masters: config.masters, timeZone: TIME_ZONE, today: day, maxDate: addDays(day, HORIZON_DAYS), demo, bookingOpen: demo || (!config.demo && !hasDemoNames) };
}

export function requireBookingOpen() {
  const result = catalog();
  if (!result.bookingOpen) throw new ApiError(503, "Онлайн-запись скоро откроется. Пока свяжитесь с барбершопом.");
  return result;
}
