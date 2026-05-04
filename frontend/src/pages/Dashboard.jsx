import { useQuery } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Metric from "../components/ui/Metric.jsx";
import Tag from "../components/ui/Tag.jsx";
import Card from "../components/ui/Card.jsx";
import Spark from "../components/ui/Spark.jsx";
import { fmt } from "../utils/format.js";

export default function Dashboard({ user }) {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: API.getSummary,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: API.getAdminAnalytics,
    enabled: user?.role === "admin",
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  });

  const loading = sumLoading || (user?.role === "admin" && analyticsLoading);

  if (loading) {
    return (
      <PageShell title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-32 flex flex-col justify-between">
              <div className="skeleton w-24 h-3 rounded" />
              <div className="skeleton w-32 h-8 rounded" />
              <div className="skeleton w-40 h-3 rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="h-80"><div className="skeleton w-full h-full rounded-xl" /></Card>
          <Card className="h-80"><div className="skeleton w-full h-full rounded-xl" /></Card>
        </div>
      </PageShell>
    );
  }

  const rate = analytics?.overview?.reconciliationRate ?? (summary ? Math.round(((summary.by_status?.matched || 0) / (summary.total || 1)) * 100) : 0);

  return (
    <PageShell title="Dashboard" sub={`Welcome back, ${user?.name?.split(" ")[0]}`}>
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Metric icon="$" label="Bank Balance"    value={fmt(summary?.bank_balance)}     color="text-blue-600" sub="Total bank transactions" />
        <Metric icon="⇄" label="Internal Balance" value={fmt(summary?.internal_balance)} color="text-indigo-600" sub="Total internal records" />
        <Metric icon="△" label="Variance"         value={fmt(summary?.variance)}         color={Math.abs(summary?.variance || 0) < 1 ? "text-green-600" : "text-red-600"} sub="Bank vs internal" />
        <Metric icon="%" label="Reconciled"       value={`${rate}%`} color="text-green-600" sub={`${summary?.by_status?.matched || 0} of ${summary?.total || 0} matched`} />
      </div>

      {/* Status breakdown + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">Transaction Status</div>
          {["pending","matched","unmatched","exception","duplicate"].map(s => {
            const count = summary?.by_status?.[s] || 0;
            const pct   = summary?.total ? (count / summary.total) * 100 : 0;
            return (
              <div key={s} className="mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <Tag label={s} />
                    <span className="text-xs font-semibold text-gray-400 tabular-nums">{count}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${s === "matched" ? "bg-green-500" : s === "exception" ? "bg-amber-500" : s === "unmatched" ? "bg-red-500" : s === "duplicate" ? "bg-indigo-500" : "bg-gray-300"}`} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </Card>

        {analytics && (
          <Card className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Transaction Volume</div>
                <div className="text-[11px] text-gray-400 font-medium mt-0.5">Last 30 days</div>
              </div>
              <span className="text-2xl font-black text-red-500 tracking-tight tabular-nums">{analytics.overview?.totalTx ?? 0}</span>
            </div>
            <div className="flex-1 min-h-[100px]">
              <Spark data={analytics.volumeByDay || []} color="#EF4444" h={90} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { l: "Users",    v: analytics.overview?.totalUsers || 0,    c: "text-indigo-600" },
                { l: "Tickets",  v: analytics.overview?.totalTickets || 0,  c: "text-blue-600" },
                { l: "Open",     v: analytics.overview?.openTickets || 0,   c: "text-red-600" },
              ].map(m => (
                <div key={m.l} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">{m.l}</div>
                  <div className={`text-lg font-black tabular-nums ${m.c}`}>{m.v}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Categories */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">Top Categories</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(summary.by_category).slice(0, 8).map(([cat, d]) => (
              <div key={cat} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="text-[11px] font-bold text-gray-500 mb-1 capitalize">{cat}</div>
                <div className="text-lg font-black text-gray-900 tracking-tight tabular-nums">{fmt(d.total)}</div>
                <div className="text-[10px] text-gray-400 font-medium">{d.count} transactions</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}

