"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, Pause, Play } from "lucide-react";
import { HERO_SLIDES, SITE } from "@/data/site";

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion(); syncVisibility();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => { media.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncVisibility); };
  }, []);
  useEffect(() => {
    if (paused || reduced || !visible || engaged) return;
    const timer = window.setInterval(() => setActive(n => (n + 1) % HERO_SLIDES.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, reduced, visible, engaged]);

  return (
    <section id="hero" className="hero-section bg-charcoal text-inverse">
      <div className="mus-container hero-layout">
        <div className="hero-copy">
          <p className="eyebrow text-mint"><span className="brand-rule" />Барбершоп МУС · {SITE.city}</p>
          <h1>Ваш характер.<br /><span className="text-mint">Наша точность.</span></h1>
          <p className="hero-description">Хорошая стрижка не меняет вас.<br className="hidden sm:block" /> Она подчёркивает главное.</p>
          <div className="hero-actions">
            <a href={SITE.bookingHref} className="mus-btn">Записаться на стрижку <ArrowUpRight size={19} /></a>
            <a href="#services" className="hero-price">от <strong>700 ₽</strong><span>Услуги и цены ↗</span></a>
          </div>
          <a href="#footer" className="hero-address"><MapPin size={17} /><span>{SITE.address}<small>{SITE.hours}</small></span></a>
        </div>
        <div className="hero-visual" role="region" aria-roledescription="карусель" aria-label="Детали барберского ремесла"
          onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)}
          onFocusCapture={() => setEngaged(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setEngaged(false); }}>
          <div className="hero-slides">
            {HERO_SLIDES.map((slide, i) => (
              <div key={slide.src} role="group" aria-roledescription="слайд" aria-label={(i + 1) + " из " + HERO_SLIDES.length} aria-hidden={active !== i} className={"hero-slide " + (active === i ? "is-active" : "")}>
                <img src={slide.src} alt={slide.alt} width={1200} height={800} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" style={{ objectPosition: slide.position }} />
              </div>
            ))}
          </div>
          <span className="hero-image-mark" aria-hidden="true">МУС / ДЕТАЛИ</span>
          <img className="hero-logo-stamp" src="/assets/brand/mus-logo.png" alt="" width={72} height={72} aria-hidden="true" />
          <div className="hero-slide-footer">
            <p>{HERO_SLIDES[active].label}</p>
            <div className="slide-controls">
              {HERO_SLIDES.map((s, i) => <button key={s.src} type="button" className={"slide-dot " + (i === active ? "is-active" : "")} aria-label={"Показать фото " + (i + 1)} aria-pressed={active === i} onClick={() => { setActive(i); setPaused(true); }}><span /></button>)}
              <button type="button" className="slide-pause" disabled={reduced} onClick={() => setPaused(v => !v)} aria-label={reduced ? "Автосмена отключена: уменьшение движения" : paused ? "Включить смену фотографий" : "Приостановить смену фотографий"}>{paused || reduced ? <Play size={15} /> : <Pause size={15} />}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="mus-container hero-bottom"><span>Стрижки · Борода · Уход</span><span>Своё место. Свой стиль.</span><a href="#services" aria-label="Перейти к услугам">Листайте ниже ↓</a></div>
    </section>
  );
}
