"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { NAV, SITE } from "@/data/site";
export function Header() {
  const [open,setOpen]=useState(false);
  const [hash,setHash]=useState("");
  const dialog=useRef<HTMLDialogElement>(null);
  const opener=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const sync=()=>setHash(window.location.hash);sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync);},[]);
  useEffect(()=>{
    if(open){dialog.current?.showModal();document.body.style.overflow="hidden";}
    else {dialog.current?.close();document.body.style.overflow="";}
    return()=>{document.body.style.overflow="";};
  },[open]);
  useEffect(()=>{const media=window.matchMedia("(min-width: 1100px)");const close=()=>{if(media.matches)setOpen(false);};media.addEventListener("change",close);return()=>media.removeEventListener("change",close);},[]);
  return <>
    <a href="#main" className="skip-link">Перейти к содержимому</a>
    <header className="site-header">
      <div className="mus-container header-inner">
        <a href="#hero" className="brand-lockup" aria-label="МУС — на главную"><img className="brand-logo" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="58" height="58" /><span className="brand-descriptor">БАРБЕРШОП<br />{SITE.city.toUpperCase()}</span></a>
        <nav className="desktop-nav" aria-label="Основная навигация">{NAV.map(item=><a key={item.href} href={item.href} aria-current={hash===item.href?"location":undefined}>{item.label}</a>)}</nav>
        <a href={SITE.bookingHref} className="mus-btn header-book">Записаться <ArrowUpRight size={17}/></a>
        <button ref={opener} type="button" className="menu-toggle" aria-label="Открыть меню" aria-expanded={open} aria-controls="mobile-menu" onClick={()=>setOpen(true)}><Menu size={25}/></button>
      </div>
    </header>
    <dialog ref={dialog} id="mobile-menu" className="mobile-drawer" aria-label="Мобильное меню" onCancel={()=>setOpen(false)} onClose={()=>{setOpen(false);opener.current?.focus();}}>
      <div className="drawer-top"><img className="brand-logo brand-logo-drawer" src="/assets/brand/mus-logo.png" alt="Логотип МУС" width="50" height="50" /><button type="button" aria-label="Закрыть меню" onClick={()=>setOpen(false)}><X size={27}/></button></div>
      <nav aria-label="Мобильная навигация">{NAV.map((item,i)=><a key={item.href} href={item.href} onClick={()=>setOpen(false)}><span>0{i+1}</span>{item.label}<ArrowUpRight size={21}/></a>)}</nav>
      <div className="drawer-contact"><p>{SITE.address}</p><p>{SITE.hours}</p><a href={SITE.phoneHref}>{SITE.phone}</a><a href={SITE.bookingHref} onClick={()=>setOpen(false)} className="mus-btn">Записаться в МУС <ArrowUpRight size={18}/></a></div>
    </dialog>
  </>;
}
