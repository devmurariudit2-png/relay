import { useState, useEffect, useCallback } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Metric from "../components/ui/Metric.jsx";
import Spark from "../components/ui/Spark.jsx";
import Spinner from "../components/ui/Spinner.jsx";

export default function Admin({ toast }) {
  const [sub, setSub] = useState("users");
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [audit, setAudit] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditHasMore, setAuditHasMore] = useState(true);
  const [auditLoadingMore, setAuditLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAuditPage = useCallback(async (page, append = false) => {
    const payload = await API.getAuditLog({ page, limit: 50 }).catch(() => ({ data: [], meta: null }));
    const logs = payload.data || [];
    const meta = payload.meta;
    setAudit(prev => append ? [...prev, ...logs] : logs);
    setAuditHasMore(meta ? meta.page < meta.pages : logs.length > 0);
    setAuditPage(page);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.getAdminUsers({ limit: 100 }).catch(() => ({ data: [] })),
      API.getAdminAnalytics().catch(() => null),
      API.getMonitoring().catch(() => null),
      loadAuditPage(1),
    ]).then(([u, a, m]) => { setUsers(u.data || u); setAnalytics(a); setMonitoring(m); setLoading(false); });
  }, [loadAuditPage]);

  const toggleRole = async (id, role) => {
    try { const u = await API.updateAdminUser(id, { role }); setUsers(p => p.map(x => x._id === id ? { ...x, role: u.role } : x)); toast("Role updated"); }
    catch (e) { toast(e.message, "error"); }
  };

  const delUser = async (id) => {
    if (!confirm("Delete user and all their data?")) return;
    try { await API.deleteAdminUser(id); setUsers(p => p.filter(x => x._id !== id)); toast("User deleted"); }
    catch (e) { toast(e.message, "error"); }
  };

  const TABS = [{ id: "users", l: "Users" }, { id: "analytics", l: "Analytics" }, { id: "monitoring", l: "Monitoring" }, { id: "audit", l: "Audit Log" }];

  const loadMoreAudit = async () => {
    setAuditLoadingMore(true);
    try {
      await loadAuditPage(auditPage + 1, true);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setAuditLoadingMore(false);
    }
  };

  return (
    <PageShell title="Admin Panel" sub="Platform management">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setSub(t.id)} className={sub === t.id ? "btn-primary" : "btn-ghost"} style={{ padding: "8px 16px", fontSize: 13 }}>{t.l}</button>)}
      </div>

      {loading ? <div style={{ padding: 60, textAlign: "center" }}><Spinner size={28} /></div> : <>
        {sub === "users" && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Transactions</th><th>Joined</th><th /></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600, color: "#1F2937" }}>{u.name}</td>
                      <td style={{ color: "#6B7280", fontSize: 12 }}>{u.email}</td>
                      <td>
                        <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }} value={u.role} onChange={e => toggleRole(u._id, e.target.value)}>
                          <option>admin</option><option>member</option><option>viewer</option>
                        </select>
                      </td>
                      <td style={{ color: "#6B7280" }}>{u.txCount}</td>
                      <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => delUser(u._id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {sub === "analytics" && analytics && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
              <Metric label="Total Users" value={analytics.overview?.totalUsers} color="#7C3AED" />
              <Metric label="Transactions" value={analytics.overview?.totalTx} color="#2563EB" />
              <Metric label="Reconciled %" value={`${analytics.overview?.reconciliationRate}%`} color="#16A34A" />
              <Metric label="Open Tickets" value={analytics.overview?.openTickets} color="#D97706" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Transaction Volume (30d)</div><Spark data={analytics.volumeByDay} color="#EF4444" h={100} /></Card>
              <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>User Growth (30d)</div><Spark data={analytics.userGrowth} color="#16A34A" h={100} /></Card>
            </div>
          </div>
        )}

        {sub === "monitoring" && monitoring && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <Metric label="Status"    value={monitoring.status}     color="#16A34A" />
              <Metric label="Uptime"    value={`${Math.round(monitoring.uptime / 3600)}h`} color="#2563EB" />
              <Metric label="Heap Used" value={`${monitoring.memory?.used}MB`} color="#D97706" />
              <Metric label="TX 24h"    value={monitoring.activity?.txLast24h} color="#7C3AED" />
            </div>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Recent Errors ({monitoring.recentErrors?.length || 0})</div>
              {monitoring.recentErrors?.length === 0 ? <div style={{ color: "#16A34A", fontSize: 13 }}>✓ No recent errors</div> :
                monitoring.recentErrors?.map((e, i) => <div key={i} style={{ fontFamily: "Geist Mono", fontSize: 11, color: "#DC2626", marginBottom: 6 }}>{JSON.stringify(e)}</div>)}
            </Card>
          </div>
        )}

         {sub === "audit" && (
         <div style={{ display: "grid", gap: 10 }}>
           <Card style={{ padding: 0, overflow: "hidden" }}>
             <div style={{ overflowX: "auto" }}>
               <table>
                 <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
                 <tbody>
                   {audit.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No audit logs</td></tr> :
                     audit.map(a => (
                       <tr key={a._id}>
                         <td style={{ color: "#1F2937" }}>{a.user?.name || "System"}</td>
                         <td className="mono" style={{ fontSize: 12 }}>{a.action}</td>
                         <td style={{ color: "#6B7280" }}>{a.entityType} {a.entityId ? `#${a.entityId.toString().slice(-6)}` : ""}</td>
                         <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</td>
                       </tr>
                     ))}
                 </tbody>
               </table>
             </div>
           </Card>
           <div style={{ display: "flex", justifyContent: "center" }}>
             <button className="btn-ghost" disabled={!auditHasMore || auditLoadingMore} onClick={loadMoreAudit}>
               {auditLoadingMore ? "Loading…" : auditHasMore ? `Load More (Page ${auditPage + 1})` : "No more logs"}
             </button>
           </div>
         </div>
       )}
      </>}
    </PageShell>
  );
}
