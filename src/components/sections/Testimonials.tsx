import { TESTIMONIALS, RATING_SCORES } from "@/data/site";
export function Testimonials() {
  return <section id="reviews" className="section-space bg-canvas"><div className="mus-container reviews-layout">
    <div className="review-summary"><p className="eyebrow">04 / Отзывы</p><h2>Лучше нас<br/>скажут гости.</h2><div className="review-score"><strong>4.9</strong><span>из 5</span></div><p className="review-stars" aria-label="Высокая оценка гостей">★★★★★</p><div className="rating-sources">{RATING_SCORES.map(s=><div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}</div></div>
    <div className="review-grid">{TESTIMONIALS.map((t,i)=><figure key={t.tag} className={"review-card "+(i===0?"review-featured":"")}><span className="quote-mark" aria-hidden="true">“</span><blockquote>{t.quote}</blockquote><figcaption>{t.tag}</figcaption></figure>)}</div>
  </div></section>;
}
