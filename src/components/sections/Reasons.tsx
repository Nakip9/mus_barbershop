import { REASONS } from "@/data/site";
export function Reasons() {
  return <section className="bg-surface pb-16 md:pb-24" aria-label="Подход МУС"><div className="mus-container principles-grid">
    {REASONS.map((r,i)=><article key={r.title}><span className="eyebrow text-teal">0{i+1} / Наш подход</span><h3>{r.title}</h3><p>{r.body}</p></article>)}
  </div></section>;
}
