import { Phone } from "lucide-react";
import { SITE } from "@/data/site";
import { BookingForm } from "@/components/booking/BookingForm";

export function BookingCTA() {
  return (
    <section id="zapis" className="online-booking section-space" aria-labelledby="booking-title">
      <div className="mus-container">
        <div className="section-heading booking-heading">
          <div><p className="eyebrow">Онлайн-запись</p><h2 id="booking-title">Ваше время.<br/>Ваш мастер.</h2></div>
          <div className="booking-intro"><p>Выберите услугу, мастера и свободное время. Запись появится в расписании сразу после подтверждения.</p><a href={SITE.phoneHref}><Phone size={16} aria-hidden="true"/>Нужна помощь? {SITE.phone}</a></div>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
