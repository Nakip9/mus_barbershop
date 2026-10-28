"use client";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { SITE } from "@/data/site";
export function FloatingBook() {
  const [show,setShow]=useState(false);
  useEffect(()=>{const sync=()=>setShow(window.scrollY>650);sync();window.addEventListener("scroll",sync,{passive:true});return()=>window.removeEventListener("scroll",sync);},[]);
  return <a href={SITE.bookingHref} className={"floating-book "+(show?"is-visible":"")} tabIndex={show?0:-1} aria-hidden={!show} aria-label="Записаться онлайн"><CalendarDays size={21}/><span>Записаться</span></a>;
}
