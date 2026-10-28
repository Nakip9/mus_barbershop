import { ArrowUpRight } from "lucide-react";
import { SERVICES, SITE } from "@/data/site";
export function Services() {
  return <section id="services" className="section-space bg-canvas">
    <div className="mus-container">
      <div className="section-heading"><div><p className="eyebrow">01 / Услуги и цены</p><h2>Без лишнего.<br /><span className="text-teal">Всё по делу.</span></h2></div><p className="section-intro">Привычная форма или новый образ — начните с того, что нужно вам. Стоимость зависит от категории мастера.</p></div>
      <div className="service-list">
        {SERVICES.map((service, i) => <article key={service.title} className="service-row">
          <div className="service-name"><span className="index-number">0{i + 1}</span><div><h3>{service.title}</h3><p>{service.note}</p><span className="service-time">{service.time}</span></div></div>
          <p className="service-description">{service.includes}</p>
          <div className="service-prices">{service.prices.map((price, j) => <div key={price}><span>{["Мастер", "Старший", "Топ-мастер"][j]}</span><strong>{price.toLocaleString("ru-RU")} ₽</strong></div>)}</div>
          <a className="round-link" href={SITE.bookingHref} aria-label={"Записаться: " + service.title}><ArrowUpRight size={23} /></a>
        </article>)}
      </div>
      <p className="service-note">Мытьё и укладка включены в мужскую стрижку. Цены указаны без доплат за сложность.</p>
    </div>
  </section>;
}
