import { useEffect, useState } from "react";
import { Check, KeyRound, LoaderCircle, Power, RefreshCw, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { createAdminUser, deleteAdminUser, listAdminUsers, updateAdminUser, type AdminUser } from "../lib/admin";

type AdminPanelProps = { onClose: () => void };
type FormMessage = { type: "error" | "success"; text: string } | null;

type PatchInput = { username: string; password?: string; display_name?: string; is_active?: boolean; is_admin?: boolean };

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<FormMessage>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      setUsers(await listAdminUsers());
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not load the user list." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function createUser() {
    setBusy("create");
    setMessage(null);
    try {
      await createAdminUser({ username: newUsername, password: newPassword, display_name: newDisplayName, is_admin: newIsAdmin });
      setNewUsername(""); setNewPassword(""); setNewDisplayName(""); setNewIsAdmin(false); setShowCreate(false);
      setMessage({ type: "success", text: "User created and enabled." });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not create the user." });
    } finally { setBusy(""); }
  }

  async function patchUser(input: PatchInput, busyKey: string, successText: string) {
    setBusy(busyKey); setMessage(null);
    try {
      await updateAdminUser(input);
      setMessage({ type: "success", text: successText });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not update the user." });
    } finally { setBusy(""); }
  }

  async function removeUser(username: string) {
    if (!window.confirm(`Delete ${username}? This removes the Auth account, profile, progress, and allowlist entry. This cannot be undone.`)) return;
    setBusy(`${username}:delete`);
    setMessage(null);
    try {
      await deleteAdminUser(username);
      setMessage({ type: "success", text: `User ${username} was deleted.` });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not delete the user." });
    } finally { setBusy(""); }
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div><div className="card-kicker">ADMIN CONSOLE ? ACCOUNT MANAGEMENT</div><h2>User management</h2><p>Create, enable, disable, and reset users. The Supabase secret stays inside the Cloudflare Pages Function.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
      </div>
      {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
      <div className="admin-toolbar"><button className="primary-button compact" onClick={() => setShowCreate((value) => !value)}><UserPlus size={15} />{showCreate ? "Hide create form" : "Create user"}</button><button className="secondary-button compact" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} />Refresh</button></div>
      {showCreate && <div className="admin-create-form">
        <div className="admin-form-grid"><label>Username<input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} placeholder="e.g. student002" autoCapitalize="none" spellCheck={false} /></label><label>Display name<input value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} placeholder="e.g. Student 002" /></label><label>Initial password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 6 characters" /></label></div>
        <label className="admin-check"><input type="checkbox" checked={newIsAdmin} onChange={(event) => setNewIsAdmin(event.target.checked)} />Grant administrator access</label>
        <button className="primary-button compact" onClick={() => void createUser()} disabled={busy === "create"}>{busy === "create" ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}Create and enable</button>
      </div>}
      <div className="admin-list">
        {loading && users.length === 0 ? <div className="admin-empty"><LoaderCircle className="spin" size={20} />Loading users...</div> : users.length === 0 ? <div className="admin-empty">No allowlisted users.</div> : users.map((user) => <AdminUserRow key={user.username} user={user} busy={busy} onPatch={patchUser} onDelete={removeUser} />)}
      </div>
      <div className="modal-note"><ShieldCheck size={15} />Changes update Supabase Auth and the username allowlist. Deleting a user also removes that user's profile and cloud progress.</div>
    </div>
  </div>;
}

function AdminUserRow({ user, busy, onPatch, onDelete }: { user: AdminUser; busy: string; onPatch: (input: PatchInput, busyKey: string, successText: string) => Promise<void>; onDelete: (username: string) => Promise<void> }) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [password, setPassword] = useState("");
  const key = user.username;
  const saving = busy.startsWith(`${key}:`);
  return <div className={`admin-user-row ${user.is_active ? "" : "is-disabled"}`}>
    <div className="admin-user-main"><div className="admin-avatar">{user.username[0]?.toUpperCase()}</div><div><strong>{user.username}</strong><span>{user.is_admin ? "Administrator" : "Learner"} ? {user.is_active ? "Enabled" : "Disabled"}</span></div></div>
    <div className="admin-user-fields"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} aria-label={`${user.username} display name`} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password (optional)" aria-label={`${user.username} new password`} /></div>
    <div className="admin-user-actions"><button className="text-button" disabled={saving || !password || password.length < 6} onClick={() => { const next = password; setPassword(""); void onPatch({ username: key, password: next }, `${key}:password`, "Password reset."); }}><KeyRound size={14} />Reset password</button><button className="text-button" disabled={saving || displayName === user.display_name} onClick={() => void onPatch({ username: key, display_name: displayName }, `${key}:name`, "Display name saved.")}><Check size={14} />Save name</button><button className="text-button" disabled={saving} onClick={() => void onPatch({ username: key, is_active: !user.is_active }, `${key}:active`, user.is_active ? "User disabled." : "User enabled.")}><Power size={14} />{user.is_active ? "Disable" : "Enable"}</button><button className="text-button" disabled={saving} onClick={() => void onPatch({ username: key, is_admin: !user.is_admin }, `${key}:admin`, user.is_admin ? "Administrator access removed." : "Administrator access granted.")}><ShieldCheck size={14} />{user.is_admin ? "Remove admin" : "Make admin"}</button><button className="text-button danger" disabled={saving || busy === `${key}:delete`} onClick={() => void onDelete(key)}><Trash2 size={14} />Delete</button></div>
  </div>;
}
