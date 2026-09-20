import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, FileText, LoaderCircle, X } from "lucide-react";
import { bookSources, getPrivateBookUrl, type BookSource } from "../lib/book";

type BookReaderPanelProps = { onClose: () => void };

export function BookReaderPanel({ onClose }: BookReaderPanelProps) {
  const [source, setSource] = useState<BookSource>(bookSources[0]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setUrl("");
    void getPrivateBookUrl(source.path).then((next) => {
      if (!cancelled) setUrl(next);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not open the private book source.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [source.path]);

  return <div className="modal-backdrop book-reader-backdrop" onClick={onClose}>
    <div className="book-reader-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading book-reader-heading"><div><div className="card-kicker">PRIVATE BOOK READER</div><h2>Original source pages</h2><p>Authenticated users can read the uploaded source PDFs here. The files stay in a private Supabase Storage bucket.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
      <div className="book-source-tabs">{bookSources.map((item) => <button key={item.id} className={source.id === item.id ? "active" : ""} onClick={() => setSource(item)}><FileText size={14} /><span>{item.label}<small>{item.note}</small></span></button>)}</div>
      {loading && <div className="book-reader-empty"><LoaderCircle className="spin" size={21} />Opening private source...</div>}
      {error && <div className="auth-message error">{error}<br /><small>Upload the matching PDF to Supabase Storage bucket <strong>book-source</strong> with the object name <strong>{source.path}</strong>.</small></div>}
      {!loading && url && <div className="book-frame-wrap"><iframe title={source.label} src={url} className="book-frame" /></div>}
      {url && <a className="secondary-button compact book-open-link" href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open in a new tab</a>}
      <div className="modal-note"><BookOpen size={15} />Private study mode: the PDFs are not part of the GitHub repository or public website assets.</div>
    </div>
  </div>;
}
