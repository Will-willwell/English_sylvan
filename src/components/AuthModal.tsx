import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthModalProps = { onClose: () => void };
type AuthMode = "signin" | "signup";

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!isSupabaseConfigured || !supabase) {
      setMessage({ type: "error", text: "Login service is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages environment variables." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must contain at least 6 characters." });
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setMessage({ type: "error", text: "The two passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          });
      setLoading(false);

      if (result.error) {
        setMessage({ type: "error", text: authErrorMessage(result.error.message) });
        return;
      }
      if (mode === "signup" && !result.data.session) {
      setMessage({ type: "success", text: "Account created. Check your email to confirm the account, then sign in." });
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      onClose();
    } catch {
      setLoading(false);
      setMessage({ type: "error", text: "Unable to reach the login service. Check the Supabase URL and try again." });
    }
  }

  return <div className="modal-backdrop auth-backdrop" onClick={onClose}>
    <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
      <div className="auth-visual">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-visual-content"><div className="auth-logo"><LockKeyhole size={18} /></div><div className="card-kicker">LINGODESK ACCOUNT</div><h2>Keep every practice session <em>on your path.</em></h2><p>Sign in to keep your learning identity. Your current progress still stays in this browser.</p><div className="auth-benefit"><CheckCircle2 size={15} />Email and password sign-in</div><div className="auth-benefit"><CheckCircle2 size={15} />Ready for progress sync later</div></div>
      </div>
      <div className="auth-form-panel">
        <button className="icon-button auth-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <div className="auth-form-heading"><div className="card-kicker">ACCOUNT ACCESS</div><h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p>{mode === "signin" ? "Continue your business English training." : "Create your learning space with email."}</p></div>
        {!isSupabaseConfigured && <div className="auth-config-note"><span />Development preview: connect Supabase before using login.</div>}
        <form onSubmit={submit} className="auth-form">
          <label>Email address<div className="auth-input"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label>
          <label>Password<div className="auth-input"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {mode === "signup" && <label>Confirm password<div className="auth-input"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" required /></div></label>}
          {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight size={16} /></button>
        </form>
        <div className="auth-switch">{mode === "signin" ? "New here?" : "Already have an account?"}<button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>{mode === "signin" ? "Create account" : "Back to sign in"}</button></div>
      </div>
    </div>
  </div>;
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (normalized.includes("user already registered")) return "This email is already registered. Sign in instead.";
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (normalized.includes("rate limit")) return "Too many requests. Please try again later.";
  return message;
}
