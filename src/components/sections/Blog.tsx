import { BLOG, SITE } from "@/data/site";
import { ArrowUpRight } from "lucide-react";
export function Blog() {
  return <section id="care" className="section-space bg-canvas"><div className="mus-container">
    <div className="section-heading"><div><p className="eyebrow">Между визитами</p><h2>Форма остаётся.<br/>Уход продолжается.</h2></div><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-link">Спросить мастера <ArrowUpRight size={18}/></a></div>
    <div className="care-grid">{BLOG.map(b=><article key={b.title}><div className="care-image"><img src={b.img} alt="" width={1200} height={800} loading="lazy"/></div><div><p className="eyebrow">{b.category}</p><h3>{b.title}</h3><p>{b.excerpt}</p></div></article>)}</div>
  </div></section>;
}
