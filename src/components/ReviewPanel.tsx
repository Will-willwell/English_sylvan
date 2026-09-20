import { Brain, Check, ChevronRight, Clock3, RotateCcw, Sparkles, Zap } from "lucide-react";
import type { Unit } from "../data/course";
import { formatReviewDue, type ReviewRating, type ReviewState } from "../lib/review";

type ReviewPanelProps = { units: Unit[]; progress: Record<number, number>; states: Record<number, ReviewState>; onSelect: (unit: Unit) => void; onRate: (unitId: number, rating: ReviewRating) => void };

export function ReviewPanel({ units, progress, states, onSelect, onRate }: ReviewPanelProps) {
  const dueUnits = units.filter((unit) => (progress[unit.id] ?? unit.progress) > 0 && (!states[unit.id] || new Date(states[unit.id].nextReviewAt).getTime() <= Date.now()));
  const queuedUnits = units.filter((unit) => (progress[unit.id] ?? unit.progress) > 0 && states[unit.id] && new Date(states[unit.id].nextReviewAt).getTime() > Date.now()).slice(0, 3);
  const reviewUnits = dueUnits.slice(0, 3);

  return <section className="review-card section-card">
    <div className="review-card-heading"><div><div className="card-kicker">SPACED REVIEW - MEMORY CYCLE</div><h2>What should you review today?</h2><p>Short reviews are scheduled before recall fades, helping you retain each Unit with less effort.</p></div><div className="review-brain"><Brain size={20} /></div></div>
    <div className="review-summary"><div><strong>{dueUnits.length}</strong><span>Due now</span></div><div><strong>{queuedUnits.length}</strong><span>Scheduled</span></div><span className="review-method"><Sparkles size={14} />Spaced repetition</span></div>
    {reviewUnits.length > 0 ? <div className="review-list">{reviewUnits.map((unit) => <div className="review-item" key={unit.id}><button className="review-item-main" onClick={() => onSelect(unit)}><span className="review-unit-number">{String(unit.id).padStart(2, "0")}</span><span><strong>{unit.title}</strong><small>{unit.chinese} - {formatReviewDue(states[unit.id])}</small></span><ChevronRight size={15} /></button><div className="review-actions"><button title="Again" onClick={() => onRate(unit.id, "again")}><RotateCcw size={13} />Again</button><button title="Hard" onClick={() => onRate(unit.id, "hard")}><Clock3 size={13} />Hard</button><button title="Good" onClick={() => onRate(unit.id, "good")}><Check size={13} />Good</button><button title="Easy" onClick={() => onRate(unit.id, "easy")}><Zap size={13} />Easy</button></div></div>)}</div> : <div className="review-empty"><Check size={17} /><div><strong>No urgent reviews today</strong><span>Complete a Unit and it will be added to your review schedule.</span></div></div>}
    {dueUnits.length > 3 && <button className="review-more" onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}>View all due Units <ChevronRight size={14} /></button>}
  </section>;
}
