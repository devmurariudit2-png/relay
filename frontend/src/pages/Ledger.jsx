import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Tag from "../components/ui/Tag.jsx";

export default function Ledger({ toast }) {
  const [source, setSource] = useState("bank");

  const { data: rows = [], isLoading: loading, error } = useQuery({
    queryKey: ['ledger', source],
    queryFn: () => API.getLedger(source)
  });

  if (error) { toast(error.message, "error"); }

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

  const buildSimplePdf = (rawText) => {
    const escapePdfText = (value) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const lines = rawText.split("\n");
    const textOps = lines
      .map((line, i) => {
        const y = 780 - i * 16;
        return `BT /F1 12 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join("\n");
    const stream = `${textOps}\n`;

    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += `${obj}\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((off) => {
      pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new TextEncoder().encode(pdf);
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

  const exportPDF = () => {
    if (!rows.length) return;
    const text = [
      `LEDGER REPORT - ${source.toUpperCase()}`,
      "===========================",
      ...rows.map(r => `${r.date} | ${r.description.slice(0, 20)} | Bal: ${r.balance}`)
    ].join("\n");
    const pdfBytes = buildSimplePdf(text);
    downloadFile(`ledger-${source}-${new Date().toISOString().slice(0, 10)}.pdf`, pdfBytes, "application/pdf");
  };


  return (
    <PageShell title="Ledger" sub="Running balance view"
      actions={
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["bank", "internal"].map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider rounded-md transition-all ${source === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {s}
              </button>
            ))}
          </div>
          <button className="btn-ghost text-[12px]" onClick={exportCSV}>Export CSV</button>
          <button className="btn-ghost text-[12px]" onClick={exportPDF}>Export PDF</button>
        </div>
      }>
      <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="w-32">Date</th>
                <th>Description</th>
                <th className="w-32">Category</th>
                <th className="w-32">Ref</th>
                <th className="text-right w-32">Debit</th>
                <th className="text-right w-32">Credit</th>
                <th className="text-right w-40">Balance</th>
                <th className="w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5,6,7,8].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-20 rounded" /></td>
                    <td><div className="skeleton h-3 w-48 rounded" /></td>
                    <td><div className="skeleton h-3 w-16 rounded" /></td>
                    <td><div className="skeleton h-3 w-12 rounded" /></td>
                    <td className="text-right"><div className="skeleton h-3 w-16 rounded ml-auto" /></td>
                    <td className="text-right"><div className="skeleton h-3 w-16 rounded ml-auto" /></td>
                    <td className="text-right"><div className="skeleton h-3 w-24 rounded ml-auto" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">No ledger entries</p>
                      <p className="text-xs text-gray-500">Records will appear here once transactions are processed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="mono text-gray-500 text-[12px]">{r.date}</td>
                    <td className="font-semibold text-gray-900 truncate max-w-[200px]">{r.description}</td>
                    <td className="text-gray-500 text-[13px]">{r.category || "—"}</td>
                    <td className="mono text-gray-400 text-[11px]">{r.reference || "—"}</td>
                    <td className="mono text-right text-red-600 tabular-nums">{r.debit ? r.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                    <td className="mono text-right text-green-600 tabular-nums">{r.credit ? r.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
                    <td className={`mono text-right font-bold tabular-nums ${r.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>{r.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td><Tag label={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
