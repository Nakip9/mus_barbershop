"use client";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BARBER_CATEGORIES, CATEGORY_DATA, SITE } from "@/data/site";
export function BarberTeam() {
  const [active,setActive]=useState(0);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]);
  const data=CATEGORY_DATA[BARBER_CATEGORIES[active]];
  return <section id="team" className="section-space bg-charcoal text-inverse"><div className="mus-container">
    <div className="section-heading"><div><p className="eyebrow text-mint">03 / Команда</p><h2>Найдите<br/><span className="text-mint">своего мастера.</span></h2></div><p className="section-intro text-soft">Разный опыт. Общий подход к работе. Выбирайте категорию, а мы поможем подобрать время.</p></div>
    <div className="team-layout">
      <div className="team-tabs" role="tablist" aria-label="Категории мастеров" aria-orientation="vertical">{BARBER_CATEGORIES.map((category,i)=><button ref={e=>{buttons.current[i]=e;}} key={category} id={"team-tab-"+i} role="tab" type="button" aria-selected={active===i} aria-controls="team-panel" tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{let next=i;if(e.key==="ArrowDown"||e.key==="ArrowRight")next=(i+1)%BARBER_CATEGORIES.length;else if(e.key==="ArrowUp"||e.key==="ArrowLeft")next=(i+BARBER_CATEGORIES.length-1)%BARBER_CATEGORIES.length;else if(e.key==="Home")next=0;else if(e.key==="End")next=BARBER_CATEGORIES.length-1;else return;e.preventDefault();setActive(next);buttons.current[next]?.focus();}}><span>0{i+1}</span>{category}<ArrowUpRight size={19}/></button>)}</div>
      <div id="team-panel" className="team-panel" role="tabpanel" aria-labelledby={"team-tab-"+active} tabIndex={0}>
        <p className="eyebrow text-mint">{BARBER_CATEGORIES[active]}</p><h3>{data.note}</h3><p>{data.detail}</p>
        {data.price && <div className="team-price"><span>Мужская стрижка</span><strong>{data.price.toLocaleString("ru-RU")} ₽</strong></div>}
        <a href={data.price?SITE.bookingHref:SITE.whatsappHref} className="mus-btn">{data.price?"Выбрать время":"Связаться с нами"} <ArrowUpRight size={18}/></a>
      </div>
    </div>
    <p className="team-footnote">Обучение в собственной школе и регулярные экзамены — часть работы нашей команды.</p>
  </div></section>;
}
