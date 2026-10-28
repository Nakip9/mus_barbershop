import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/data/site";
export function Discount() {
  return <section id="offers" className="section-space bg-surface"><div className="mus-container">
    <div className="section-heading"><div><p className="eyebrow">05 / Приятные поводы</p><h2>Начнём со знакомства.<br/><span className="text-teal">Продолжим по привычке.</span></h2></div></div>
    <div className="offers-layout">
      <article className="offer-first"><div><p className="eyebrow">Ваш первый визит</p><div className="offer-amount">−200<span>₽</span></div></div><div><h3>Новая стрижка.<br/>Приятное начало.</h3><p>Скидка 200 ₽ на любую услугу для тех, кто ещё не был в МУС. Сообщите о первом визите при записи.</p><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-link">Записаться со скидкой <ArrowUpRight size={19}/></a><small>Один раз для нового гостя. Промокод действует 30 дней. Не суммируется с другими скидками.</small></div></article>
      <article className="offer-loyalty"><p className="eyebrow text-mint">Для постоянных гостей</p><div className="loyalty-number">11<span>-я</span></div><h3>Стрижка — в подарок.</h3><p>Возвращайтесь за привычной формой. Каждая одиннадцатая стрижка бесплатная.</p><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-link">Уточнить условия <ArrowUpRight size={18}/></a></article>
    </div>
    <div className="partner-note"><p>Предложения партнёров МУС</p><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-link">Узнать, что действует сейчас <ArrowUpRight size={17}/></a></div>
  </div></section>;
}
