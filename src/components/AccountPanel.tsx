import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, LogOut, ShieldCheck, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type AccountPanelProps = { username: string; onClose: () => void; onSignOut: () => Promise<void> };

type Message = { type: "error" | "success"; text: string } | null;

export function AccountPanel({ username, onClose, onSignOut }: AccountPanelProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "The two passwords do not match." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message || "Could not update the password." });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setMessage({ type: "success", text: "Password updated successfully." });
  }

  async function signOut() {
    setSigningOut(true);
    await onSignOut();
    setSigningOut(false);
    onClose();
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="account-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div><div className="card-kicker">ACCOUNT SECURITY</div><h2>Account settings</h2><p>Manage the password for your LingoDesk account.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
      </div>
      <div className="account-identity"><div className="account-large-avatar">{username[0]?.toUpperCase() || "U"}</div><div><strong>{username}</strong><span>Username account ? cloud progress enabled</span></div></div>
      {message && <div className={`auth-message ${message.type}`}>{message.type === "success" && <CheckCircle2 size={14} />}{message.text}</div>}
      <form className="account-form" onSubmit={submit}>
        <div className="account-section-heading"><KeyRound size={16} /><strong>Change password</strong></div>
        <label>New password<div className="auth-input"><KeyRound size={16} /><input type={showPassword ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        <label>Confirm password<div className="auth-input"><KeyRound size={16} /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the new password" autoComplete="new-password" required /></div></label>
        <button className="primary-button account-submit" type="submit" disabled={loading}>{loading ? "Updating..." : "Update password"}</button>
      </form>
      <div className="account-security-note"><ShieldCheck size={16} /><span>Your learning progress is linked to this account and remains available after you sign in on another device.</span></div>
      <button className="account-signout" onClick={() => void signOut()} disabled={signingOut}><LogOut size={15} />{signingOut ? "Signing out..." : "Sign out"}</button>
    </div>
  </div>;
}
