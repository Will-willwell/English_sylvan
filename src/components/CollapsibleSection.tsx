import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function CollapsibleSection({ title, eyebrow, open, onToggle, children }: { title: string; eyebrow?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={`collapsible-section ${open ? "is-open" : "is-collapsed"}`}>
    <button className="collapsible-trigger" onClick={onToggle} aria-expanded={open}>
      <span><small>{eyebrow}</small><strong>{title}</strong></span><ChevronDown size={17} />
    </button>
    {open && <div className="collapsible-content">{children}</div>}
  </section>;
}
