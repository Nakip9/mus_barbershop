import { SITE } from "@/data/site";
import { ArrowUpRight } from "lucide-react";
export function GalleryStrip() {
  return <section id="about" className="section-space bg-surface">
    <div className="mus-container about-layout">
      <div className="about-image"><img src="/assets/editorial/mus-tools.webp" alt="Инструменты барбера: ножницы и расчёска" width={1536} height={1024} loading="lazy" /><span className="photo-caption">МУС / Внимание к деталям</span></div>
      <div className="about-copy"><p className="eyebrow">02 / О МУС</p><h2>Стрижка —<br />дело личное.</h2><p className="lead">Не подгоняем человека под стрижку. Находим форму, в которой ему комфортно.</p><p>В МУС можно прийти с готовой идеей, фотографией или просто желанием что-то изменить. Обсудим длину, привычки и укладку — и только потом возьмёмся за ножницы.</p><a href={SITE.bookingHref} className="text-link">Давайте познакомимся <ArrowUpRight size={18} /></a></div>
    </div>
  </section>;
}
