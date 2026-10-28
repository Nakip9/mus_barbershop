import { ArrowUpRight, MapPin } from "lucide-react";
import { SITE, NAV } from "@/data/site";
export function Footer() {
  const mapHref="https://yandex.ru/maps/?text="+encodeURIComponent(SITE.city+", "+SITE.address);
  return <footer id="footer" className="site-footer">
    <div className="mus-container">
      <div className="footer-heading"><a href="#hero" aria-label="МУС — на главную"><img className="footer-logo" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="108" height="108" /></a><p>Свой стиль.<br />Своё место.</p></div>
      <div className="footer-grid">
        <div><p className="eyebrow text-mint">Приходите</p><p className="footer-address">{SITE.city}<br/>{SITE.address}</p><a href={mapHref} target="_blank" rel="noopener noreferrer" className="footer-link"><MapPin size={16}/>Открыть на карте <ArrowUpRight size={15}/></a></div>
        <div><p className="eyebrow text-mint">Свяжитесь с нами</p><a href={SITE.phoneHref} className="footer-phone">{SITE.phone}</a><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="footer-link">Написать в WhatsApp <ArrowUpRight size={15}/></a><p className="footer-hours">{SITE.hours}</p></div>
        <nav aria-label="Навигация в подвале">{NAV.map(item=><a href={item.href} key={item.href}>{item.label}</a>)}<a href="#offers">Акции и предложения</a><a href="#faq">Вопросы и ответы</a><a href="#certificates">Подарочные сертификаты</a></nav>
      </div>
      <div className="footer-bottom"><p>© МУС. Барбершоп в Челябинске.</p><a href="/privacy">О данных записи</a><a href="/staff">Кабинет мастера</a></div>
    </div>
  </footer>;
}
