import { STEPS_BOOKING } from "@/data/site";
export function BookingSteps() {
  return <section className="section-space bg-surface"><div className="mus-container">
    <div className="section-heading"><div><p className="eyebrow">От записи до результата</p><h2>Всё начинается<br/>с одного сообщения.</h2></div></div>
    <ol className="booking-steps">{STEPS_BOOKING.map((s,i)=><li key={s.title}><span className="step-number">0{i+1}</span><div><h3>{s.title}</h3><p>{s.body}</p></div></li>)}</ol>
  </div></section>;
}
