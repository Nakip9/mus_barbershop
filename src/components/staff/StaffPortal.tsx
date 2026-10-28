"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, LockKeyhole, LogOut, Plus, RefreshCw, Scissors, ShieldCheck, X } from "lucide-react";
import type { BookingCatalog, BookingRecord, BookingStatus, ScheduleBlock, ScheduleResponse, StaffUser } from "@/lib/booking-types";

type Session = { user: StaffUser | null; configured: boolean; demo: boolean };
type Boot = { session: Session; catalog: BookingCatalog };
class SessionExpired extends Error {}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const data = await response.json().catch(() => null);
  if (response.status === 401 && !url.endsWith("/login")) throw new SessionExpired("Сессия завершена. Войдите снова.");
  if (!response.ok) throw new Error(data?.error || "Не удалось выполнить запрос. Попробуйте ещё раз.");
  return data as T;
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Не удалось связаться с сервером. Проверьте соединение."; }
function isAborted(error: unknown) { return error instanceof Error && error.name === "AbortError"; }
function shiftDay(date: string, delta: number) { const value = new Date(date + "T12:00:00Z"); value.setUTCDate(value.getUTCDate() + delta); return value.toISOString().slice(0, 10); }
function readableDate(date: string) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z")); }
const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
const statuses: Record<BookingStatus, string> = { confirmed: "Ожидается", completed: "Завершена", cancelled: "Отменена" };

export default function StaffPortal() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      request<Session>("/api/staff/session", { signal: controller.signal }),
      request<BookingCatalog>("/api/booking/catalog", { signal: controller.signal }),
    ]).then(([session, catalog]) => { if (!controller.signal.aborted) setBoot({ session, catalog }); })
      .catch((err: unknown) => { if (!isAborted(err)) setError(errorMessage(err)); });
    return () => controller.abort();
  }, [attempt]);

  const reloadSession = useCallback(async () => {
    const [session, catalog] = await Promise.all([request<Session>("/api/staff/session"), request<BookingCatalog>("/api/booking/catalog")]);
    setBoot({ session, catalog });
    setNotice("");
  }, []);

  const expireSession = useCallback(() => {
    setBoot((previous) => previous ? { ...previous, session: { ...previous.session, user: null } } : null);
    setNotice("Сессия завершена. Войдите снова.");
  }, []);

  const logout = useCallback(async () => {
    await request("/api/staff/session", { method: "DELETE" });
    setBoot((previous) => previous ? { ...previous, session: { ...previous.session, user: null } } : null);
    setNotice("Вы вышли из кабинета.");
  }, []);

  return (
    <div className="staff-shell">
      <a className="skip-link" href="#staff-main">Перейти к содержимому</a>
      <header className="staff-header">
        <div className="staff-container staff-header-inner">
          <a href="/" aria-label="МУС — на главную"><img className="staff-logo" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="58" height="58" /></a>
          <span className="staff-header-title">Кабинет команды</span>
          <a href="/" className="staff-back"><ArrowLeft size={15} aria-hidden="true" /><span>На сайт</span></a>
        </div>
      </header>
      <main id="staff-main" className="staff-container">
        {!boot ? <div className="staff-loading" role="status">{error ? <><p>{error}</p><button className="mus-btn" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Попробовать снова</button></> : <><CalendarDays size={30} aria-hidden="true" /><p>Открываем кабинет…</p></>}</div>
          : !boot.session.user ? <StaffLogin configured={boot.session.configured} demo={boot.session.demo} notice={notice} onLogin={reloadSession} />
          : <StaffDashboard key={boot.session.user.username} user={boot.session.user} catalog={boot.catalog} onExpired={expireSession} onLogout={logout} />}
      </main>
      <footer className="staff-footer staff-container">МУС · Челябинск <span>Время в расписании — местное, UTC+5</span></footer>
    </div>
  );
}

function StaffLogin({ configured, demo, notice, onLogin }: { configured: boolean; demo: boolean; notice: string; onLogin: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try { await request("/api/staff/login", { method: "POST", body: JSON.stringify({ username: data.get("username"), password: data.get("password") }) }); await onLogin(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }

  return (
    <div className="staff-login-layout">
      <div className="staff-login-intro">
        <p className="eyebrow">Для команды МУС</p>
        <h1>Ваш день.<br />Всё по местам.</h1>
        <p>Записи клиентов, время для работы и перерывов — в одном расписании.</p>
        <div className="staff-intro-detail"><CalendarDays size={20} aria-hidden="true" /><span>Расписание на каждый день</span></div>
        <div className="staff-intro-detail"><ShieldCheck size={20} aria-hidden="true" /><span>Личный доступ для каждого мастера</span></div>
      </div>
      <section className="staff-login-card" aria-labelledby="staff-login-title">
        <div className="staff-login-icon"><LockKeyhole size={22} aria-hidden="true" /></div>
        {demo && <span className="staff-badge">Тестовый режим</span>}
        <h2 id="staff-login-title">Вход в кабинет</h2>
        <p className="staff-muted">Доступ для мастеров и администратора.</p>
        {notice && <p className="staff-notice" role="status">{notice}</p>}
        {!configured ? <div className="staff-setup"><h3>Настройте доступ</h3><p>Запустите <code>npm run booking:setup</code> на сервере. Команда создаст личные данные для входа.</p><p>Файл с доступами: <code>.local/staff-access.txt</code>. Его видит только владелец сервера.</p></div>
          : <form onSubmit={submit} className="staff-login-form">
            <label className="staff-field">Логин<input name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={80} disabled={pending} /></label>
            <label className="staff-field">Пароль<input name="password" type="password" autoComplete="current-password" required maxLength={256} disabled={pending} /></label>
            {error && <p className="staff-error" role="alert">{error}</p>}
            <button className="mus-btn" type="submit" disabled={pending}>{pending ? "Входим…" : "Войти"}<ArrowRight size={17} aria-hidden="true" /></button>
            <p className="staff-help">Данные для входа выдаёт администратор барбершопа.</p>
          </form>}
      </section>
    </div>
  );
}

function StaffDashboard({ user, catalog, onExpired, onLogout }: { user: StaffUser; catalog: BookingCatalog; onExpired: () => void; onLogout: () => Promise<void> }) {
  const [date, setDate] = useState(catalog.today);
  const [masterId, setMasterId] = useState(user.role === "master" ? user.masterId || "" : "");
  const [result, setResult] = useState<{ key: string; data: ScheduleResponse } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const activeController = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const mutationBusy = useRef(false);
  const queryKey = date + ":" + masterId;
  const schedule = result?.key === queryKey ? result.data : null;
  const isAdmin = user.role === "admin";
  const availableMasters = (schedule?.masters || catalog.masters).filter((master) => isAdmin || master.id === user.masterId);

  const refresh = useCallback(async () => {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const currentGeneration = ++generation.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (masterId) params.set("masterId", masterId);
      const data = await request<ScheduleResponse>("/api/staff/schedule?" + params.toString(), { signal: controller.signal });
      if (controller.signal.aborted || generation.current !== currentGeneration) return;
      setResult({ key: date + ":" + masterId, data }); setError("");
      setUpdatedAt(new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: catalog.timeZone }).format(new Date()));
    } catch (err) {
      if (isAborted(err) || generation.current !== currentGeneration) return;
      if (err instanceof SessionExpired) onExpired(); else setError(errorMessage(err));
    } finally { if (generation.current === currentGeneration) setLoading(false); }
  }, [date, masterId, catalog.timeZone, onExpired]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const refreshVisible = () => { if (!document.hidden && !mutationBusy.current) void refresh(); };
    const interval = window.setInterval(refreshVisible, 30000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => { window.clearTimeout(initialRefresh); window.clearInterval(interval); document.removeEventListener("visibilitychange", refreshVisible); activeController.current?.abort(); generation.current++; };
  }, [refresh]);

  async function mutate(key: string, url: string, options: RequestInit, success: string): Promise<boolean> {
    if (mutationBusy.current) return false;
    mutationBusy.current = true; setBusy(key); setMessage(""); setError("");
    try {
      await request(url, options);
      setMessage(success); setConfirmId(""); await refresh(); return true;
    } catch (err) { if (err instanceof SessionExpired) onExpired(); else setError(errorMessage(err)); return false; }
    finally { mutationBusy.current = false; setBusy(""); }
  }

  function changeDate(nextDate: string) { if (!nextDate) return; setDate(nextDate); setConfirmId(""); setMessage(""); setShowBlockForm(false); }
  async function signOut() {
    if (mutationBusy.current) return;
    mutationBusy.current = true; setBusy("logout"); setError("");
    try { await onLogout(); } catch (err) { if (err instanceof SessionExpired) onExpired(); else setError(errorMessage(err)); }
    finally { mutationBusy.current = false; setBusy(""); }
  }

  const bookings = schedule?.bookings || [];
  const pending = bookings.filter((booking) => booking.status === "confirmed");
  const completed = bookings.filter((booking) => booking.status === "completed");
  const cancelled = bookings.filter((booking) => booking.status === "cancelled");
  const events: ({ kind: "booking"; at: string; item: BookingRecord } | { kind: "block"; at: string; item: ScheduleBlock })[] = [
    ...bookings.map((item) => ({ kind: "booking" as const, at: item.time, item })),
    ...(schedule?.blocks || []).map((item) => ({ kind: "block" as const, at: item.startTime, item })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="staff-dashboard">
      <div className="staff-page-heading"><div><p className="eyebrow">{isAdmin ? "Кабинет администратора" : "Кабинет мастера"}</p><h1>Расписание</h1><p className="staff-muted">{user.name} <span className="staff-heading-dot">·</span> Челябинск</p></div><button className="staff-button" disabled={!!busy} onClick={() => void signOut()}><LogOut size={16} aria-hidden="true" />{busy === "logout" ? "Выходим…" : "Выйти"}</button></div>
      {catalog.demo && <div className="staff-notice staff-demo"><span className="staff-badge">Тестовый режим</span><p>Это демонстрационное расписание. Тестовые записи хранятся отдельно от реальных.</p></div>}
      <div className="staff-toolbar">
        <div className="staff-date-controls">
          <button className="staff-icon-button" aria-label="Предыдущий день" disabled={!!busy} onClick={() => changeDate(shiftDay(date, -1))}><ArrowLeft size={18} aria-hidden="true" /></button>
          <label className="staff-date-label"><span className="staff-sr-only">Дата расписания</span><input type="date" value={date} onChange={(event) => changeDate(event.target.value)} disabled={!!busy} /></label>
          <button className="staff-icon-button" aria-label="Следующий день" disabled={!!busy} onClick={() => changeDate(shiftDay(date, 1))}><ArrowRight size={18} aria-hidden="true" /></button>
          <button className="staff-button staff-today" disabled={!!busy || date === catalog.today} onClick={() => changeDate(catalog.today)}>Сегодня</button>
        </div>
        {isAdmin && <label className="staff-filter"><span className="staff-sr-only">Мастер</span><select value={masterId} disabled={!!busy} onChange={(event) => { setMasterId(event.target.value); setConfirmId(""); setShowBlockForm(false); }}><option value="">Все мастера</option>{availableMasters.map((master) => <option key={master.id} value={master.id}>{master.name}</option>)}</select></label>}
        <button className="staff-button staff-refresh" onClick={() => void refresh()} disabled={loading || !!busy}><RefreshCw size={16} aria-hidden="true" />{loading ? "Обновляем…" : "Обновить"}</button>
      </div>
      <div className="staff-date-heading"><h2>{readableDate(date)}</h2><p>Местное время, UTC+5</p></div>
      <div className="staff-stats" aria-label="Итоги дня"><div><span>Ожидаются</span><strong>{schedule ? pending.length : "—"}</strong></div><div><span>Завершены</span><strong>{schedule ? completed.length : "—"}</strong></div><div><span>Отменены</span><strong>{schedule ? cancelled.length : "—"}</strong></div><div><span>Перерывы</span><strong>{schedule ? schedule.blocks.length : "—"}</strong></div></div>
      {error && <div className="staff-error" role="alert">{error}{schedule && <p>Показано последнее полученное расписание. Обновите его перед следующим действием.</p>}</div>}
      {message && <p className="staff-notice" role="status">{message}</p>}
      <div className="staff-workspace">
        <section className="staff-agenda" aria-labelledby="staff-agenda-title" aria-busy={loading}>
          <div className="staff-section-heading"><h2 id="staff-agenda-title">Записи на день</h2><button className="staff-button" disabled={!!busy || !availableMasters.length} aria-expanded={showBlockForm} aria-controls="staff-block-form" onClick={() => setShowBlockForm((value) => !value)}>{showBlockForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}<span>{showBlockForm ? "Закрыть" : "Перерыв"}</span></button></div>
          {showBlockForm && <BlockForm key={date + ":" + masterId} date={date} masterId={masterId} masters={availableMasters} pending={busy === "block"} onSubmit={async (data) => { const ok = await mutate("block", "/api/staff/blocks", { method: "POST", body: JSON.stringify(data) }, "Перерыв добавлен. Это время закрыто для онлайн-записи."); if (ok) setShowBlockForm(false); }} />}
          {!schedule ? <div className="staff-empty" role="status"><CalendarDays size={28} aria-hidden="true" /><p>{loading ? "Загружаем расписание…" : "Расписание пока недоступно."}</p></div>
            : !events.length ? <div className="staff-empty"><CalendarDays size={32} aria-hidden="true" /><h3>День пока свободен</h3><p>Новые онлайн-записи появятся здесь автоматически. Нерабочее время можно закрыть кнопкой «Перерыв».</p></div>
              : <div className="staff-event-list">{events.map((event) => event.kind === "booking" ? <AppointmentCard key={event.item.id} booking={event.item} isAdmin={isAdmin} disabled={!!busy || !!error} pending={busy === event.item.id} confirming={confirmId === event.item.id} onConfirm={() => setConfirmId(event.item.id)} onDismiss={() => setConfirmId("")} onStatus={(status) => void mutate(event.item.id, "/api/staff/bookings/" + encodeURIComponent(event.item.id), { method: "PATCH", body: JSON.stringify({ status }) }, status === "cancelled" ? "Запись отменена. Время снова доступно клиентам." : "Визит отмечен как завершённый.")} />
                : <div className="staff-block-card" key={event.item.id}><div className="staff-event-time"><strong>{event.item.startTime}</strong><span>{event.item.endTime}</span></div><div className="staff-event-main"><span className="staff-status staff-status-block"><Clock3 size={13} aria-hidden="true" />Перерыв</span><h3>{event.item.note || "Время закрыто"}</h3><p>{availableMasters.find((master) => master.id === event.item.masterId)?.name || "Мастер"}</p>{confirmId === event.item.id ? <div className="staff-inline-confirm" role="group" aria-label="Подтверждение удаления перерыва"><p>Открыть это время для записи?</p><div><button className="staff-button staff-button-strong" disabled={!!busy} onClick={() => void mutate(event.item.id, "/api/staff/blocks/" + encodeURIComponent(event.item.id), { method: "DELETE" }, "Перерыв удалён. Время снова доступно для записи.")}>{busy === event.item.id ? "Удаляем…" : "Да, открыть"}</button><button className="staff-button" disabled={!!busy} onClick={() => setConfirmId("")}>Оставить</button></div></div> : <button className="staff-text-button" disabled={!!busy || !!error} onClick={() => setConfirmId(event.item.id)}>Удалить перерыв</button>}</div></div>)}</div>}
        </section>
        <aside className="staff-sidebar">
          <div className="staff-sidebar-card"><div className="staff-sidebar-icon"><Scissors size={20} aria-hidden="true" /></div><h2>Команда на день</h2>{availableMasters.filter((master) => !masterId || master.id === masterId).map((master) => { const working = master.workDays.includes(new Date(date + "T12:00:00Z").getUTCDay()); return <div className="staff-master-summary" key={master.id}><strong>{master.name}</strong><span>{master.category}</span><p>{working ? master.startTime + "–" + master.endTime : "Выходной"}</p></div>; })}</div>
          <ScheduleSettings user={user} masters={availableMasters} busy={!!busy} onSaved={async () => { await refresh(); setMessage("График мастера сохранён. Свободные окна обновлены."); }} />
          <p className="staff-auto-refresh">Обновление каждые 30 секунд, пока кабинет открыт.{updatedAt && <span>Последнее обновление: {updatedAt}</span>}</p>
        </aside>
      </div>
    </div>
  );
}

function AppointmentCard({ booking, isAdmin, disabled, pending, confirming, onConfirm, onDismiss, onStatus }: { booking: BookingRecord; isAdmin: boolean; disabled: boolean; pending: boolean; confirming: boolean; onConfirm: () => void; onDismiss: () => void; onStatus: (status: BookingStatus) => void }) {
  return <article className={"staff-booking-card staff-booking-" + booking.status}>
    <div className="staff-event-time"><strong>{booking.time}</strong><span>{booking.endTime}</span></div>
    <div className="staff-event-main"><div className="staff-event-top"><span className={"staff-status staff-status-" + booking.status}>{statuses[booking.status]}</span><span className="staff-reference">№ {booking.reference}</span></div><h3>{booking.name}</h3><a className="staff-client-phone" href={"tel:" + booking.phone.replace(/[^+\d]/g, "")}>{booking.phone}</a><p className="staff-service-name">{booking.serviceName} <span>·</span> {money(booking.price)}</p>{isAdmin && <p className="staff-booking-master">Мастер: {booking.masterName}</p>}
      {booking.status === "confirmed" && (confirming ? <div className="staff-inline-confirm" role="group" aria-label="Подтверждение отмены записи"><p>Отменить запись {booking.name} на {booking.time}?</p><span>Время освободится. Сообщите клиенту об отмене.</span><div><button className="staff-button staff-button-strong" disabled={disabled} onClick={() => onStatus("cancelled")}>{pending ? "Отменяем…" : "Да, отменить"}</button><button className="staff-button" disabled={disabled} onClick={onDismiss}>Сохранить запись</button></div></div> : <div className="staff-booking-actions"><button className="staff-button staff-button-strong" disabled={disabled} onClick={() => onStatus("completed")}><Check size={15} aria-hidden="true" />{pending ? "Сохраняем…" : "Завершить визит"}</button><button className="staff-text-button" disabled={disabled} onClick={onConfirm}>Отменить</button></div>)}
    </div>
  </article>;
}

function BlockForm({ date, masterId, masters, pending, onSubmit }: { date: string; masterId: string; masters: BookingCatalog["masters"]; pending: boolean; onSubmit: (data: { masterId: string; date: string; startTime: string; endTime: string; note: string }) => Promise<void> }) {
  const [selectedMaster, setSelectedMaster] = useState(masterId || masters[0]?.id || "");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("14:00");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (endTime <= startTime) { setError("Время окончания должно быть позже начала."); return; }
    const data = new FormData(event.currentTarget); setError("");
    await onSubmit({ masterId: selectedMaster, date, startTime, endTime, note: String(data.get("note") || "").trim() });
  }
  return <form id="staff-block-form" className="staff-block-form" onSubmit={submit}><h3>Закрыть время для записи</h3><p>Добавьте обед, перерыв или другой недоступный промежуток. Занятое клиентом время закрыть нельзя.</p><div className="staff-block-fields"><label className="staff-field staff-block-master">Мастер<select value={selectedMaster} onChange={(event) => setSelectedMaster(event.target.value)} disabled={pending} required>{masters.map((master) => <option key={master.id} value={master.id}>{master.name}</option>)}</select></label><label className="staff-field">Начало<input type="time" required step={900} value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={pending} /></label><label className="staff-field">Окончание<input type="time" required step={900} value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={pending} /></label><label className="staff-field staff-block-note">Комментарий<input type="text" name="note" maxLength={120} placeholder="Например, обед" disabled={pending} /></label></div>{error && <p className="staff-error" role="alert">{error}</p>}<button className="mus-btn" disabled={pending} type="submit">{pending ? "Добавляем…" : "Добавить перерыв"}</button></form>;
}

function ScheduleSettings({ user, masters, busy, onSaved }: { user: StaffUser; masters: BookingCatalog["masters"]; busy: boolean; onSaved: () => Promise<void> }) {
  const [selected, setSelected] = useState(user.role === "master" ? user.masterId || "" : masters[0]?.id || "");
  const master = masters.find(item => item.id === selected) || masters[0];
  const [days, setDays] = useState<number[]>(master?.workDays || []);
  const [start, setStart] = useState(master?.startTime || "10:00");
  const [end, setEnd] = useState(master?.endTime || "22:00");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!master) return; setDays(master.workDays); setStart(master.startTime); setEnd(master.endTime); }, [master?.id, master?.startTime, master?.endTime, master?.workDays.join(",")]);
  if (!master) return null;
  const labels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!days.length || end <= start) { setError("Выберите рабочие дни и корректное время смены."); return; }
    setSaving(true);
    try { await request("/api/staff/schedule-settings", { method: "PATCH", body: JSON.stringify({ masterId: master.id, workDays: days, startTime: start, endTime: end }) }); await onSaved(); setOpen(false); }
    catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }
  return <div className="staff-sidebar-card staff-schedule-settings"><div className="staff-section-heading"><h2>График мастера</h2><button className="staff-text-button" type="button" onClick={() => setOpen(value => !value)}>{open ? "Закрыть" : "Изменить"}</button></div><p className="staff-muted">Клиенты увидят только свободные окна в эти дни и часы.</p>{!open ? <div className="staff-master-summary"><strong>{master.name}</strong><span>{master.workDays.map(day => labels[day]).join(" · ")}</span><p>{master.startTime}–{master.endTime}</p></div> : <form onSubmit={save} className="staff-settings-form"><label className="staff-field">Мастер{user.role === "admin" ? <select value={selected} onChange={event => setSelected(event.target.value)}>{masters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <input value={master.name} readOnly />}</label><fieldset className="staff-day-picker"><legend>Рабочие дни</legend>{labels.map((label, day) => <label key={day}><input type="checkbox" checked={days.includes(day)} onChange={() => setDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort((a,b) => a-b))} />{label}</label>)}</fieldset><div className="staff-settings-times"><label className="staff-field">Начало<input type="time" step={900} value={start} onChange={event => setStart(event.target.value)} /></label><label className="staff-field">Окончание<input type="time" step={900} value={end} onChange={event => setEnd(event.target.value)} /></label></div>{error && <p className="staff-error" role="alert">{error}</p>}<button className="mus-btn" disabled={saving || busy}>{saving ? "Сохраняем…" : "Сохранить график"}</button></form>}</div>;
}
