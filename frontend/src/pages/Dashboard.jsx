import { useQuery } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Metric from "../components/ui/Metric.jsx";
import Tag from "../components/ui/Tag.jsx";
import Card from "../components/ui/Card.jsx";
import Spark from "../components/ui/Spark.jsx";
import { fmt } from "../utils/format.js";

export default function Dashboard({ user }) {
  const { data: summary, isLoading: sumLoading } = useQuery({ queryKey: ['summary'], queryFn: API.getSummary });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: API.getAdminAnalytics,
    enabled: user?.role === "admin",
    retry: false
  });

  const loading = sumLoading || (user?.role === "admin" && analyticsLoading);

  if (loading) return <PageShell title="Dashboard"><div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={32} /></div></PageShell>;

  const rate = analytics?.overview?.reconciliationRate ?? (summary ? Math.round(((summary.by_status?.matched || 0) / (summary.total || 1)) * 100) : 0);

  return (
    <PageShell title="Dashboard" sub={`Welcome back, ${user?.name?.split(" ")[0]}`}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Metric icon="$" label="Bank Balance"    value={fmt(summary?.bank_balance)}     color="#2563EB" sub="Total bank transactions" />
        <Metric icon="⇄" label="Internal Balance" value={fmt(summary?.internal_balance)} color="#7C3AED" sub="Total internal records" />
        <Metric icon="△" label="Variance"         value={fmt(summary?.variance)}         color={Math.abs(summary?.variance || 0) < 1 ? "#16A34A" : "#DC2626"} sub="Bank vs internal" />
        <Metric icon="%" label="Reconciled"       value={`${rate}%`} color="#16A34A"     sub={`${summary?.by_status?.matched || 0} of ${summary?.total || 0} matched`} />
      </div>

      {/* Status breakdown + chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, color: "#374151" }}>Transaction Status</div>
          {["pending","matched","unmatched","exception","duplicate"].map(s => {
            const count = summary?.by_status?.[s] || 0;
            const pct   = summary?.total ? (count / summary.total) * 100 : 0;
            return (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag label={s} /><span style={{ fontSize: 12, color: "#6B7280" }}>{count}</span></div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "Geist Mono" }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: s === "matched" ? "#16A34A" : s === "exception" ? "#D97706" : s === "unmatched" ? "#DC2626" : s === "duplicate" ? "#7C3AED" : "#9CA3AF", borderRadius: 2, transition: "width .8s" }} />
                </div>
              </div>
            );
          })}
        </Card>

        {analytics && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Transaction Volume</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Last 30 days</div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#EF4444", letterSpacing: "-1px" }}>{analytics.overview?.totalTx ?? 0}</span>
            </div>
            <Spark data={analytics.volumeByDay || []} color="#EF4444" h={90} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginTop: 16 }}>
              {[
                { l: "Users",    v: analytics.overview?.totalUsers || 0,    c: "#7C3AED" },
                { l: "Tickets",  v: analytics.overview?.totalTickets || 0,  c: "#2563EB" },
                { l: "Open",     v: analytics.overview?.openTickets || 0,   c: "#DC2626" },
              ].map(m => (
                <div key={m.l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", border: "1px solid #E5E7EB" }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Categories */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#374151" }}>Top Categories</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {Object.entries(summary.by_category).slice(0, 8).map(([cat, d]) => (
              <div key={cat} style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 600, textTransform: "capitalize" }}>{cat}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1F2937", letterSpacing: "-.5px" }}>{fmt(d.total)}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{d.count} transactions</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
