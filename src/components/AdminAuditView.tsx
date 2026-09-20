import { useEffect, useState } from "react";
import { FileKey2, LoaderCircle, RefreshCw } from "lucide-react";
import { getAdminAudit, type AdminAuditLog } from "../lib/admin";

const labels: Record<string, string> = {
  user_created: "Created user",
  user_updated: "Updated user",
  user_enabled: "Enabled user",
  user_disabled: "Disabled user",
  user_password_reset: "Reset password",
  user_admin_granted: "Granted admin access",
  user_admin_revoked: "Removed admin access",
  user_deleted: "Deleted user",
};

export function AdminAuditView() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try { setLogs(await getAdminAudit(username)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load audit log."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, [username]);

  return <div className="admin-audit-view">
    <div className="admin-activity-toolbar"><label>Filter target user<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="All users or username" autoCapitalize="none" /></label><button className="secondary-button compact" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} />Refresh</button></div>
    {error && <div className="auth-message error">{error}</div>}
    {loading && logs.length === 0 ? <div className="admin-empty"><LoaderCircle className="spin" size={20} />Loading audit log...</div> : logs.length === 0 ? <div className="admin-empty">No administrator actions recorded yet.</div> : <div className="admin-activity-list">{logs.map((log) => <div className="admin-activity-row" key={log.id}><div className="admin-activity-icon"><FileKey2 size={15} /></div><div className="admin-activity-main"><strong>{labels[log.action] ?? log.action}<span>? {log.target_username}</span></strong><small>By {log.actor_username}{log.metadata && Object.keys(log.metadata).length ? ` ? ${formatMetadata(log.metadata)}` : ""}</small></div><time>{formatDate(log.created_at)}</time></div>)}</div>}
  </div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatMetadata(metadata: Record<string, unknown>) { return Object.entries(metadata).map(([key, value]) => `${key}: ${String(value)}`).join(", "); }
