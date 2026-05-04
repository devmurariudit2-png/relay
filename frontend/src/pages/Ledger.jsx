import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Tag from "../components/ui/Tag.jsx";
import Metric from "../components/ui/Metric.jsx";
import Spinner from "../components/ui/Spinner.jsx";

export default function Ledger({ toast }) {
  const [source, setSource] = useState("bank");

  const { data: rows = [], isLoading: loading, error } = useQuery({
    queryKey: ['ledger', source],
    queryFn: () => API.getLedger(source)
  });

  if (error) { toast?.(error.message, "error"); }

  const stats = useMemo(() => {
    const debit = rows.reduce((acc, r) => acc + (r.debit || 0), 0);
    const credit = rows.reduce((acc, r) => acc + (r.credit || 0), 0);
    const balance = rows[rows.length - 1]?.balance || 0;
    return { debit, credit, balance };
  }, [rows]);

  const downloadFile = (name, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const headers = ["Date", "Description", "Category", "Ref", "Debit", "Credit", "Balance", "Status"];
    const csvContent = [
      headers.join(","),
      ...rows.map(r => [
        r.date, 
        JSON.stringify(r.description), 
        r.category || "", 
        r.reference || "", 
        r.debit || 0, 
        r.credit || 0, 
        r.balance || 0, 
        r.status
      ].join(","))
    ].join("\n");
    downloadFile(`ledger-${source}-${new Date().toISOString().slice(0, 10)}.csv`, csvContent, "text/csv;charset=utf-8");
  };

  return (
    <PageShell title="Financial Ledger" sub="Real-time running balance and history"
      actions={
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200/50">
            {["bank", "internal"].map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-6 py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all ${source === s ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      }>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Metric title="Total Debits" value={stats.debit} type="currency" trend="-2.4%" color="red" />
        <Metric title="Total Credits" value={stats.credit} type="currency" trend="+12.5%" color="green" />
        <Metric title="Closing Balance" value={stats.balance} type="currency" color="blue" />
      </div>

      <Card className="p-0 overflow-hidden border-gray-200/60 shadow-xl bg-white/80 backdrop-blur-sm">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Spinner size={40} color="#EF4444" />
            <p className="text-gray-400 font-medium animate-pulse">Calculating balances...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Debit</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Credit</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Balance</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-gray-900 font-bold">No ledger entries found</h3>
                        <p className="text-gray-500 text-sm max-w-xs">There are no transactions recorded for the {source} source yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-500 text-[12px] mono">{r.date}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900 text-[14px] leading-tight group-hover:text-red-600 transition-colors">{r.description}</td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">{r.category || "General"}</td>
                      <td className="px-6 py-4 text-gray-300 text-[11px] mono group-hover:text-gray-500">{r.reference || "—"}</td>
                      <td className="px-6 py-4 text-right mono text-red-500 tabular-nums">{r.debit ? r.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="px-6 py-4 text-right mono text-green-600 tabular-nums">{r.credit ? r.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className={`px-6 py-4 text-right mono font-bold tabular-nums text-[14px] ${r.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                        {r.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2, style: "currency", currency: "INR" })}
                      </td>
                      <td className="px-6 py-4">
                        <Tag label={r.status} color={r.status === 'matched' ? 'green' : r.status === 'exception' ? 'red' : 'gray'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
