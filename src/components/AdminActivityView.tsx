import { useEffect, useState } from "react";
import { Activity, Clock3, LoaderCircle, RefreshCw, UsersRound } from "lucide-react";
import { getAdminActivity, type AdminActivityPayload } from "../lib/admin";

const labels: Record<string, string> = {
  login: "Sign in",
  unit_opened: "Opened Unit",
  practice_started: "Started practice",
  practice_completed: "Completed practice",
  dialogue_started: "Started dialogue",
  dialogue_completed: "Completed dialogue",
  progress_updated: "Progress updated",
};

export function AdminActivityView() {
  const [payload, setPayload] = useState<AdminActivityPayload | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setPayload(await getAdminActivity(username));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load activity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [username]);

  return <div className="admin-activity-view">
    <div className="admin-activity-toolbar"><label>Filter user<select value={username} onChange={(event) => setUsername(event.target.value)}><option value="">All users</option>{payload?.users.map((user) => <option key={user.username} value={user.username}>{user.username}{user.is_active ? "" : " (disabled)"}</option>)}</select></label><button className="secondary-button compact" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} />Refresh</button></div>
    {error && <div className="auth-message error">{error}</div>}
    <div className="admin-stat-grid">
      <Stat icon={<UsersRound size={17} />} label="Total users" value={payload?.stats.total_users ?? 0} />
      <Stat icon={<UsersRound size={17} />} label="Enabled users" value={payload?.stats.enabled_users ?? 0} />
      <Stat icon={<Activity size={17} />} label="Active in recent feed" value={payload?.stats.active_users ?? 0} />
      <Stat icon={<Clock3 size={17} />} label="Completed Units" value={payload?.stats.completed_units ?? 0} />
    </div>
    {loading && !payload ? <div className="admin-empty"><LoaderCircle className="spin" size={20} />Loading activity...</div> : payload?.activities.length ? <div className="admin-activity-list">{payload.activities.map((item) => <div className="admin-activity-row" key={item.id}><div className="admin-activity-icon"><Activity size={15} /></div><div className="admin-activity-main"><strong>{item.username} <span>{labels[item.activity_type] ?? item.activity_type}</span></strong><small>{item.unit_id ? `Unit ${item.unit_id}` : "Account"}{item.metadata && Object.keys(item.metadata).length ? ` ? ${formatMetadata(item.metadata)}` : ""}</small></div><time>{formatDate(item.created_at)}</time></div>)}</div> : <div className="admin-empty">No activity recorded yet.</div>}
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="admin-stat"><div className="admin-stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMetadata(metadata: Record<string, unknown>) {
  return Object.entries(metadata).map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}
