"use client";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { FAQ, SITE } from "@/data/site";
export function Faq() {
  const [open,setOpen]=useState<number|null>(0);
  return <section id="faq" className="section-space bg-surface"><div className="mus-container faq-layout">
    <div className="faq-intro"><p className="eyebrow">06 / До встречи</p><h2>Есть вопрос?<br/><span className="text-teal">Давайте разберёмся.</span></h2><p>Собрали то, о чём чаще всего спрашивают перед визитом.</p><a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-link">Задать свой вопрос <ArrowUpRight size={18}/></a></div>
    <div className="faq-list">{FAQ.map((item,i)=><article key={item.q} className={"faq-item "+(open===i?"is-open":"")}><h3><button id={"faq-question-"+i} type="button" aria-expanded={open===i} aria-controls={"faq-answer-"+i} onClick={()=>setOpen(open===i?null:i)}><span className="faq-index">0{i+1}</span><span>{item.q}</span><Plus size={20}/></button></h3><div id={"faq-answer-"+i} role="region" aria-labelledby={"faq-question-"+i} hidden={open!==i} className="faq-answer"><p>{item.a}</p></div></article>)}</div>
  </div></section>;
}
