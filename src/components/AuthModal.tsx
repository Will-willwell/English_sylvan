import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthModalProps = { on??: () => void };
type AuthMode = "signin" | "signup";

export function AuthModal({ on?? }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, set??] = useState("");
  const [confirm??, setConfirm??] = useState("");
  const [show??, setShow??] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!isSupabaseConfigured || !supabase) {
      setMessage({ type: "error", text: "??????????? Cloudflare Pages ??????? VITE_SUPABASE_URL ? VITE_SUPABASE_ANON_KEY?" });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "?? must contain at least 6 characters." });
      return;
    }
    if (mode === "signup" && password !== confirm??) {
      setMessage({ type: "error", text: "???????????" });
      return;
    }

    setLoading(true);
    const result = mode === "signin"
      ? await supabase.auth.signInWith??({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);

    if (result.error) {
      setMessage({ type: "error", text: authErrorMessage(result.error.message) });
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage({ type: "success", text: "??????????????????????" });
      setMode("signin");
      set??("");
      setConfirm??("");
      return;
    }
    on??();
  }

  return <div className="modal-backdrop auth-backdrop" onClick={on??}>
    <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
      <div className="auth-visual">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-visual-content"><div className="auth-logo"><LockKeyhole size={18} /></div><div className="card-kicker">LINGODESK ????</div><h2>???????<em>??????????</em></h2><p>?????????????????????????????</p><div className="auth-benefit"><CheckCircle2 size={15} />???? + ????</div><div className="auth-benefit"><CheckCircle2 size={15} />???????????</div></div>
      </div>
      <div className="auth-form-panel">
        <button className="icon-button auth-close" onClick={on??} aria-label="??"><X size={19} /></button>
        <div className="auth-form-heading"><div className="card-kicker">????</div><h2>{mode === "signin" ? "????" : "??????"}</h2><p>{mode === "signin" ? "?????????????" : "????????????"}</p></div>
        {!isSupabaseConfigured && <div className="auth-config-note"><span />??????? Supabase ????????</div>}
        <form onSubmit={submit} className="auth-form">
          <label>????<div className="auth-input"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label>
          <label>??<div className="auth-input"><LockKeyhole size={16} /><input type={show?? ? "text" : "password"} value={password} onChange={(event) => set??(event.target.value)} placeholder="?? 6 ???" autoComplete={mode === "signin" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShow??((value) => !value)} aria-label={show?? ? "????" : "????"}>{show?? ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {mode === "signup" && <label>????<div className="auth-input"><LockKeyhole size={16} /><input type={show?? ? "text" : "password"} value={confirm??} onChange={(event) => setConfirm??(event.target.value)} placeholder="??????" autoComplete="new-password" required /></div></label>}
          {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? "????" : mode === "signin" ? "??" : "??"}<ArrowRight size={16} /></button>
        </form>
        <div className="auth-switch">{mode === "signin" ? "??????" : "??????"}<button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>{mode === "signin" ? "??" : "????"}</button></div>
      </div>
    </div>
  </div>;
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "?????????";
  if (normalized.includes("user already registered")) return "This email is already registered. ?? instead.";
  if (normalized.includes("email not confirmed")) return "????????????????";
  if (normalized.includes("rate limit")) return "?????????????";
  return message;
}
