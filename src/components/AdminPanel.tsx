import { useEffect, useState } from "react";
import { Check, KeyRound, LoaderCircle, Power, RefreshCw, ShieldCheck, UserPlus, X } from "lucide-react";
import { createAdminUser, listAdminUsers, updateAdminUser, type AdminUser } from "../lib/admin";

type AdminPanelProps = { onClose: () => void };
type FormMessage = { type: "error" | "success"; text: string } | null;

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
      setMessage({ type: "error", text: error instanceof Error ? error.message : "?????????" });
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
      setMessage({ type: "success", text: "??????" });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "???????" });
    } finally { setBusy(""); }
  }

  async function patchUser(input: { username: string; password?: string; display_name?: string; is_active?: boolean; is_admin?: boolean }, busyKey: string, successText: string) {
    setBusy(busyKey); setMessage(null);
    try {
      await updateAdminUser(input);
      setMessage({ type: "success", text: successText });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "???????" });
    } finally { setBusy(""); }
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div><div className="card-kicker">ADMIN CONSOLE ? ???</div><h2>????</h2><p>??????????????????????? Cloudflare Pages Function ????</p></div>
        <button className="icon-button" onClick={onClose} aria-label="??"><X size={19} /></button>
      </div>
      {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
      <div className="admin-toolbar"><button className="primary-button compact" onClick={() => setShowCreate((value) => !value)}><UserPlus size={15} />{showCreate ? "????" : "????"}</button><button className="secondary-button compact" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} />??</button></div>
      {showCreate && <div className="admin-create-form">
        <div className="admin-form-grid"><label>???<input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} placeholder="?? student002" autoCapitalize="none" spellCheck={false} /></label><label>????<input value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} placeholder="?? Student 002" /></label><label>????<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="?? 6 ???" /></label></div>
        <label className="admin-check"><input type="checkbox" checked={newIsAdmin} onChange={(event) => setNewIsAdmin(event.target.checked)} />?????????</label>
        <button className="primary-button compact" onClick={() => void createUser()} disabled={busy === "create"}>{busy === "create" ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}?????</button>
      </div>}
      <div className="admin-list">
        {loading && users.length === 0 ? <div className="admin-empty"><LoaderCircle className="spin" size={20} />?????????</div> : users.length === 0 ? <div className="admin-empty">????????</div> : users.map((user) => <AdminUserRow key={user.username} user={user} busy={busy} onPatch={patchUser} />)}
      </div>
      <div className="modal-note"><ShieldCheck size={15} />???????? Supabase Auth ?????????????????????</div>
    </div>
  </div>;
}

function AdminUserRow({ user, busy, onPatch }: { user: AdminUser; busy: string; onPatch: (input: { username: string; password?: string; display_name?: string; is_active?: boolean; is_admin?: boolean }, busyKey: string, successText: string) => Promise<void> }) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [password, setPassword] = useState("");
  const key = user.username;
  const saving = busy.startsWith(`${key}:`);
  return <div className={`admin-user-row ${user.is_active ? "" : "is-disabled"}`}>
    <div className="admin-user-main"><div className="admin-avatar">{user.username[0]?.toUpperCase()}</div><div><strong>{user.username}</strong><span>{user.is_admin ? "???" : "????"} ? {user.is_active ? "???" : "???"}</span></div></div>
    <div className="admin-user-fields"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} aria-label={`${user.username} ????`} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="???????" aria-label={`${user.username} ???`} /></div>
    <div className="admin-user-actions"><button className="text-button" disabled={saving || !password || password.length < 6} onClick={() => { const next = password; setPassword(""); void onPatch({ username: key, password: next }, `${key}:password`, "??????"); }}><KeyRound size={14} />????</button><button className="text-button" disabled={saving || displayName === user.display_name} onClick={() => void onPatch({ username: key, display_name: displayName }, `${key}:name`, "????????")}><Check size={14} />????</button><button className="text-button" disabled={saving} onClick={() => void onPatch({ username: key, is_active: !user.is_active }, `${key}:active`, user.is_active ? "??????" : "??????")}><Power size={14} />{user.is_active ? "??" : "??"}</button><button className="text-button" disabled={saving} onClick={() => void onPatch({ username: key, is_admin: !user.is_admin }, `${key}:admin`, user.is_admin ? "?????????" : "?????????")}><ShieldCheck size={14} />{user.is_admin ? "?????" : "?????"}</button></div>
  </div>;
}
