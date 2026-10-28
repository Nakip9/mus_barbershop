import { ArrowUpRight, Check } from "lucide-react";
import { CERTIFICATES, SITE } from "@/data/site";
export function Certificates() {
  return <section id="certificates" className="section-space bg-mint-light"><div className="mus-container certificate-layout">
    <div className="gift-card" aria-label="Подарочный сертификат МУС"><div><img className="gift-logo" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="48" height="48" /><span>ДЛЯ НЕГО</span></div><p>Время<br/>для себя.</p><div><span>ПОДАРОЧНЫЙ СЕРТИФИКАТ</span><span>от 500 ₽</span></div></div>
    <div><p className="eyebrow">Подарок с вниманием</p><h2>Хороший повод<br/>позаботиться.</h2><p className="section-intro">Подарите не вещь, а визит к мастеру. Получатель сам выберет услугу и удобное время.</p><ul className="gift-benefits">{CERTIFICATES.advantages.map(a=><li key={a}><Check size={18}/>{a}</li>)}</ul><div className="gift-amounts">{CERTIFICATES.amounts.map(a=><span key={a}>{a}</span>)}</div><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="mus-btn mus-btn-secondary">Оформить сертификат <ArrowUpRight size={18}/></a></div>
  </div></section>;
}
