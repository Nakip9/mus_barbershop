"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Download, Phone, RefreshCw, Scissors } from "lucide-react";
import { SITE } from "@/data/site";
import type { BookingCatalog, BookingReceipt } from "@/lib/booking-types";

type Slot = { time: string; masterId: string };
type Result = { booking: BookingReceipt; demo: boolean };
type FormErrors = Partial<Record<"name" | "phone" | "consent" | "time", string>>;

const currency = (amount: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(amount);
const readableDate = (date: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "short", timeZone: "Asia/Yekaterinburg" }).format(new Date(date + "T12:00:00+05:00"));

async function readResponse<T>(response: Response): Promise<T> {
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new Error(value?.error || "Сервис временно недоступен. Попробуйте ещё раз.");
  return value as T;
}

function saveCalendar(receipt: BookingReceipt) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MUS//Online Booking//RU", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + receipt.reference + "@mus-booking", "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(new Date(receipt.date + "T" + receipt.time + ":00+05:00")), "DTEND:" + stamp(new Date(receipt.date + "T" + receipt.endTime + ":00+05:00")), "SUMMARY:" + escape("МУС · " + receipt.serviceName), "LOCATION:" + escape(SITE.city + ", " + SITE.address), "DESCRIPTION:" + escape("Мастер: " + receipt.masterName + ". Запись № " + receipt.reference + ". Для переноса или отмены: " + SITE.phone), "END:VEVENT", "END:VCALENDAR"];
  const objectUrl = URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "МУС-" + receipt.reference + ".ics";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function BookingForm() {
  const [catalog, setCatalog] = useState<BookingCatalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [masterId, setMasterId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [slotsVersion, setSlotsVersion] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const requestRef = useRef<{ signature: string; id: string } | null>(null);
  const submittingRef = useRef(false);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/booking/catalog", { signal: controller.signal, cache: "no-store" })
      .then(readResponse<BookingCatalog>)
      .then((value) => { setCatalog(value); setServiceId(value.services[0]?.id || ""); setMasterId(value.masters[0]?.id || ""); setDate(value.today); })
      .catch((error: Error) => { if (!controller.signal.aborted) setCatalogError(error.message); });
    return () => controller.abort();
  }, [catalogVersion]);

  useEffect(() => {
    if (!catalog || !serviceId || !masterId || !date || date < catalog.today || date > catalog.maxDate || !catalog.bookingOpen) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ serviceId, masterId, date });
    fetch("/api/booking/slots?" + query, { signal: controller.signal, cache: "no-store" })
      .then(readResponse<{ slots: Slot[]; date: string }>)
      .then((value) => { if (!controller.signal.aborted) { setSlots(value.slots); setSlotsLoading(false); } })
      .catch((error: Error) => { if (!controller.signal.aborted) { setSlotsError(error.message); setSlotsLoading(false); } });
    return () => controller.abort();
  }, [catalog, serviceId, masterId, date, slotsVersion]);

  useEffect(() => { if (result) receiptHeading.current?.focus(); }, [result]);

  const service = catalog?.services.find((item) => item.id === serviceId);
  const master = catalog?.masters.find((item) => item.id === masterId);
  const price = service && master ? service.prices[master.priceIndex] : undefined;
  const dateValid = !!catalog && date >= catalog.today && date <= catalog.maxDate;

  function resetSlots() {
    setTime(""); setSlots([]); setSlotsLoading(true); setSlotsError(""); setSubmitError("");
    setErrors((current) => ({ ...current, time: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || !catalog?.bookingOpen) return;
    const nextErrors: FormErrors = {};
    if (!time || !slots.some((slot) => slot.time === time && slot.masterId === masterId)) nextErrors.time = "Выберите свободное время.";
    if (name.trim().length < 2 || name.trim().length > 80) nextErrors.name = "Укажите имя: от 2 до 80 символов.";
    if (!/^[78]\d{10}$/.test(phone.replace(/\D/g, ""))) nextErrors.phone = "Укажите российский номер из 11 цифр, начиная с +7 или 8.";
    if (!consent) nextErrors.consent = "Для записи нужно согласие на обработку имени и телефона.";
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const payload = { serviceId, masterId, date, time, name: name.trim(), phone: phone.trim(), consent: true, website };
    const signature = JSON.stringify(payload);
    if (requestRef.current?.signature !== signature) requestRef.current = { signature, id: crypto.randomUUID() };
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: requestRef.current.id }) });
      if (response.status === 409) {
        resetSlots();
        setSlotsVersion((current) => current + 1);
      }
      const value = await readResponse<Result>(response);
      setResult(value);
      setName(""); setPhone(""); setConsent(false); setWebsite("");
      requestRef.current = null;
    } catch (error) {
      setSubmitError(error instanceof TypeError ? "Не удалось получить ответ. Проверьте интернет и повторите отправку: повторная попытка не создаст вторую запись." : error instanceof Error ? error.message : "Не удалось записаться. Попробуйте ещё раз.");
    } finally { submittingRef.current = false; setSubmitting(false); }
  }

  if (!catalog) return <div className="booking-state" role="status">{catalogError ? <><p>{catalogError}</p><button type="button" className="mus-btn mus-btn-secondary" onClick={() => { setCatalogError(""); setCatalogVersion((current) => current + 1); }}><RefreshCw size={17} aria-hidden="true"/>Попробовать ещё раз</button><a href={SITE.phoneHref}>Записаться по телефону: {SITE.phone}</a></> : <><CalendarDays size={26} aria-hidden="true"/><p>Загружаем услуги и расписание…</p></>}</div>;

  if (result) return <div className="booking-receipt">
    <div className="booking-receipt-mark"><CheckCircle2 size={32} aria-hidden="true"/></div>
    <p className="eyebrow">{result.demo ? "Демонстрационный режим" : "До встречи в МУС"}</p>
    <h3 ref={receiptHeading} tabIndex={-1}>{result.demo ? "Тестовая запись сохранена" : "Вы записаны!"}</h3>
    <p className="booking-receipt-note">{result.demo ? "Это проверка системы, а не реальная запись в барбершоп." : "Время закреплено за вами. Сохраните номер записи — он поможет перенести или отменить визит."}</p>
    <div className="booking-receipt-reference">№ {result.booking.reference}</div>
    <dl className="booking-receipt-details"><div><dt>Услуга</dt><dd>{result.booking.serviceName}</dd></div><div><dt>Мастер</dt><dd>{result.booking.masterName}</dd></div><div><dt>Дата и время</dt><dd>{readableDate(result.booking.date)} · {result.booking.time}–{result.booking.endTime}<small>Челябинск, UTC+5</small></dd></div><div><dt>Стоимость</dt><dd>{currency(result.booking.price)}</dd></div></dl>
    <div className="booking-receipt-actions">{!result.demo && <button type="button" className="mus-btn" onClick={() => saveCalendar(result.booking)}><Download size={18} aria-hidden="true"/>Добавить в календарь</button>}<button type="button" className="mus-btn mus-btn-secondary" onClick={() => { setResult(null); resetSlots(); setSlotsVersion((current) => current + 1); }}>{result.demo ? "Попробовать другую запись" : "Записать ещё одного гостя"}<ArrowRight size={18} aria-hidden="true"/></button></div>
    <p className="booking-receipt-help">Для переноса или отмены: <a href={SITE.phoneHref}>{SITE.phone}</a></p>
  </div>;

  return <>
    {catalog.demo && <div className="booking-mode-note" role="note"><CalendarDays size={19} aria-hidden="true"/><div><strong>Демонстрационный режим. Записи тестовые.</strong><span>Можно пройти весь путь записи. Для настоящего визита позвоните в барбершоп.</span></div></div>}
    {!catalog.bookingOpen ? <div className="booking-state"><h3>Онлайн-запись временно закрыта</h3><p>Поможем выбрать время по телефону.</p><a className="mus-btn" href={SITE.phoneHref}><Phone size={18} aria-hidden="true"/>{SITE.phone}</a></div> : <form className="booking-form" onSubmit={submit} ref={formRef} noValidate>
      <fieldset className="booking-fields" disabled={submitting}>
        <legend className="booking-visually-hidden">Запись в барбершоп МУС</legend>
        <div className="booking-main">
          <div className="booking-panel">
            <div className="booking-step-heading"><span>01</span><h3>Услуга и мастер</h3></div>
            <div className="booking-two-columns">
              <div className="booking-field"><label htmlFor="booking-service">Услуга</label><select id="booking-service" name="serviceId" value={serviceId} onChange={(event) => { setServiceId(event.target.value); resetSlots(); }}>{catalog.services.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} мин</option>)}</select></div>
              <div className="booking-field"><label htmlFor="booking-master">Мастер</label><select id="booking-master" name="masterId" value={masterId} onChange={(event) => { setMasterId(event.target.value); resetSlots(); }}>{catalog.masters.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</select></div>
            </div>
          </div>
          <div className="booking-panel">
            <div className="booking-step-heading"><span>02</span><h3>Дата и время</h3></div>
            <div className="booking-date-row"><div className="booking-field"><label htmlFor="booking-date">Дата визита</label><input id="booking-date" type="date" name="date" value={date} min={catalog.today} max={catalog.maxDate} required aria-describedby="booking-timezone" onChange={(event) => { setDate(event.target.value); resetSlots(); }}/></div><p id="booking-timezone"><Clock3 size={16} aria-hidden="true"/>Время Челябинска<br/>UTC+5</p></div>
            <fieldset className="booking-time-field"><legend>Свободное время</legend><div className="booking-slot-status" aria-live="polite">{!dateValid ? "Выберите дату в доступном периоде." : slotsLoading ? "Проверяем свободное время…" : slotsError ? slotsError : slots.length === 0 ? "На эту дату нет свободного времени. Выберите другой день или мастера." : `${slots.length} ${slots.length % 10 === 1 && slots.length % 100 !== 11 ? "вариант" : slots.length % 10 >= 2 && slots.length % 10 <= 4 && (slots.length % 100 < 12 || slots.length % 100 > 14) ? "варианта" : "вариантов"} для записи`}</div>
              {slotsError && <button type="button" className="booking-retry" onClick={() => { resetSlots(); setSlotsVersion((current) => current + 1); }}><RefreshCw size={15} aria-hidden="true"/>Обновить время</button>}
              {!slotsLoading && dateValid && !slotsError && <div className="booking-slots">{slots.map((slot) => <label key={slot.masterId + slot.time} className={"booking-slot" + (time === slot.time ? " is-selected" : "")}><input type="radio" name="booking-time" value={slot.time} checked={time === slot.time} aria-describedby={errors.time ? "booking-time-error" : undefined} onChange={() => { setTime(slot.time); setErrors((current) => ({ ...current, time: undefined })); setSubmitError(""); }}/><span>{slot.time}</span>{time === slot.time && <Check size={13} aria-hidden="true"/>}</label>)}</div>}
              {errors.time && <p id="booking-time-error" className="booking-field-error">{errors.time}</p>}
            </fieldset>
          </div>
          <div className="booking-panel">
            <div className="booking-step-heading"><span>03</span><h3>Ваши контакты</h3></div>
            <div className="booking-two-columns"><div className="booking-field"><label htmlFor="booking-name">Ваше имя</label><input id="booking-name" name="name" autoComplete="given-name" placeholder="Как к вам обращаться" maxLength={80} value={name} required aria-invalid={!!errors.name} aria-describedby={errors.name ? "booking-name-error" : undefined} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }}/>{errors.name && <p id="booking-name-error" className="booking-field-error">{errors.name}</p>}</div><div className="booking-field"><label htmlFor="booking-phone">Телефон</label><input id="booking-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" maxLength={22} value={phone} required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "booking-phone-error" : "booking-phone-note"} onChange={(event) => { setPhone(event.target.value); setErrors((current) => ({ ...current, phone: undefined })); }}/>{errors.phone ? <p id="booking-phone-error" className="booking-field-error">{errors.phone}</p> : <p id="booking-phone-note" className="booking-field-note">Для связи по вашей записи</p>}</div></div>
            <div className="booking-honeypot" aria-hidden="true"><label htmlFor="booking-website">Сайт</label><input id="booking-website" name="website" autoComplete="off" tabIndex={-1} value={website} onChange={(event) => setWebsite(event.target.value)}/></div>
            <div className="booking-consent"><input id="booking-consent" name="consent" type="checkbox" checked={consent} required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "booking-consent-error" : undefined} onChange={(event) => { setConsent(event.target.checked); setErrors((current) => ({ ...current, consent: undefined })); }}/><label htmlFor="booking-consent">Согласен на обработку имени и телефона для оформления записи в соответствии с <a href="/privacy" target="_blank" rel="noopener noreferrer">политикой конфиденциальности</a>.</label></div>
            {errors.consent && <p id="booking-consent-error" className="booking-field-error">{errors.consent}</p>}
          </div>
        </div>
        <aside className="booking-summary" aria-label="Ваша запись">
          <div className="booking-summary-heading"><Scissors size={23} aria-hidden="true"/><h3>Ваша запись</h3></div>
          <dl><div><dt>Услуга</dt><dd>{service?.name || "Выберите услугу"}</dd></div><div><dt>Мастер</dt><dd>{master?.name || "Выберите мастера"}<small>{master?.category}</small></dd></div><div><dt>Когда</dt><dd>{dateValid ? readableDate(date) : "Выберите дату"}<small>{time ? time + " · Челябинск" : "Выберите свободное время"}</small></dd></div><div className="booking-summary-duration"><dt><Clock3 size={15} aria-hidden="true"/>Длительность</dt><dd>{service ? service.durationMinutes + " мин" : "—"}</dd></div></dl>
          <div className="booking-summary-total"><span>Стоимость</span><strong>{price !== undefined ? currency(price) : "—"}</strong></div>
          <p className="booking-payment-note">Оплата в барбершопе.<br/>Предоплата не требуется.</p>
          {submitError && <p className="booking-submit-error" role="alert">{submitError}</p>}
          <button className="mus-btn booking-submit" type="submit" disabled={submitting || slotsLoading || !dateValid || !time || price === undefined}>{submitting ? "Сохраняем запись…" : catalog.demo ? "Создать тестовую запись" : "Подтвердить запись"}{!submitting && <ArrowRight size={18} aria-hidden="true"/>}</button>
          <span className="booking-visually-hidden" role="status">{submitting ? "Сохраняем запись. Подождите." : ""}</span>
          {!time && <p className="booking-submit-hint">Сначала выберите свободное время</p>}
          <a className="booking-summary-phone" href={SITE.phoneHref}><Phone size={15} aria-hidden="true"/>{SITE.phone}</a>
        </aside>
      </fieldset>
    </form>}
  </>;
}

