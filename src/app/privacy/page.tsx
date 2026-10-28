import type { Metadata } from "next";
import { SITE } from "@/data/site";

export const metadata: Metadata = { title: "Данные онлайн-записи — МУС", robots: { index: false, follow: false } };

export default function BookingDataPage() {
  return <main className="information-page mus-container">
    <a href="/" aria-label="МУС — на главную"><img className="information-logo" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="88" height="88" /></a>
    <p className="eyebrow">Онлайн-запись</p><h1>Как используются<br/>данные записи</h1>
    <p className="information-lead">Для записи нужны ваше имя, телефон, выбранные услуга, мастер, дата и время.</p>
    <section><h2>Для организации визита</h2><p>Данные сохраняются на сервере барбершопа. Администратор видит расписание, а мастер — записи к нему. Телефон нужен, чтобы связаться с вами по поводу визита.</p></section>
    <section><h2>Расписание</h2><p>Запись сразу появляется в закрытом кабинете команды. Мастер видит только свои визиты, а администратор — расписание всей команды. Мастер может самостоятельно изменить рабочие дни и часы в кабинете.</p></section>
    <section><h2>Исправление или отмена</h2><p>Для изменения записи или обращения по поводу ваших данных свяжитесь с МУС: <a href={SITE.phoneHref}>{SITE.phone}</a>. Назовите номер записи, показанный после отправки формы.</p></section>
    <section className="information-note"><h2>Пока сайт настраивается</h2><p>Если в форме указан демонстрационный режим, запись является тестовой и не резервирует реальный визит. Для проверки используйте вымышленные данные. До запуска реальной записи владелец должен дополнить сведения об операторе данных, условиях и сроках их обработки.</p></section>
    <a href="/#zapis" className="mus-btn">Вернуться к записи</a>
  </main>;
}
