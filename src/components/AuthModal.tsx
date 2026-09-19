import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, UserRound, X } from "lucide-react";
import { isSupabaseConfigured, isValidUsername, normalizeUsername, supabase, usernameToAuthEmail } from "../lib/supabase";

type AuthModalProps = { onClose: () => void; required?: boolean };
type AuthMessage = { type: "error" | "success"; text: string };

export function AuthModal({ onClose, required = false }: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const normalizedUsername = normalizeUsername(username);
    if (!isSupabaseConfigured || !supabase) {
      setMessage({ type: "error", text: "Login service is not configured yet. Contact the administrator." });
      return;
    }
    if (!isValidUsername(normalizedUsername)) {
      setMessage({ type: "error", text: "Username must be 3-32 characters: letters, numbers, dot, underscore, or hyphen." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToAuthEmail(normalizedUsername), password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: authErrorMessage(error.message) });
      return;
    }
    setMessage({ type: "success", text: "Signed in. Opening your learning space..." });
    window.setTimeout(onClose, 250);
  }

  return <div className="modal-backdrop auth-backdrop" onClick={() => !required && onClose()}>
    <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
      <div className="auth-visual">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-visual-content">
          <div className="auth-logo"><LockKeyhole size={18} /></div>
          <div className="card-kicker">LINGODESK LEARNING ACCOUNT</div>
          <h2>Keep every practice session <em>on your learning path.</em></h2>
          <p>Accounts are created by the administrator. Unregistered usernames cannot sign in, and no real email address is shown in the app.</p>
          <div className="auth-benefit"><CheckCircle2 size={15} />Username and password login</div>
          <div className="auth-benefit"><CheckCircle2 size={15} />No self-service registration</div>
        </div>
      </div>
      <div className="auth-form-panel">
        {!required && <button className="icon-button auth-close" onClick={onClose} aria-label="Close"><X size={19} /></button>}
        <div className="auth-form-heading"><div className="card-kicker">ACCOUNT ACCESS</div><h2>Sign in to LingoDesk</h2><p>Enter the username and password provided by the administrator.</p></div>
        {!isSupabaseConfigured && <div className="auth-config-note"><span />Login service is not configured.</div>}
        <form onSubmit={submit} className="auth-form">
          <label>Username<div className="auth-input"><UserRound size={16} /><input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. sylvan001" autoComplete="username" autoCapitalize="none" spellCheck={false} required /></div></label>
          <label>Password<div className="auth-input"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}<ArrowRight size={16} /></button>
        </form>
        <div className="auth-switch">Need an account? <span>Contact the administrator</span></div>
      </div>
    </div>
  </div>;
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials") || normalized.includes("user not found") || normalized.includes("username is not registered")) return "Incorrect username or password, or this username is not registered.";
  if (normalized.includes("email not confirmed")) return "This account is not enabled yet. Contact the administrator.";
  if (normalized.includes("rate limit")) return "Too many attempts. Try again later.";
  return "Incorrect username or password, or this username is not registered.";
}
