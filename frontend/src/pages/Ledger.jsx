import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["bank", "internal"].map(s => (
            <button key={s} onClick={() => setSource(s)}
              className={source === s ? "btn-primary" : "btn-ghost"}
              style={{ padding: "8px 16px", fontSize: 13 }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div style={{ width: 1, background: "#E5E7EB", margin: "0 4px" }} />
          <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportCSV}>CSV</button>
          <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportPDF}>PDF</button>
        </div>
      }>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Ref</th>
                  <th className="mono" style={{ textAlign: "right" }}>Debit</th>
                  <th className="mono" style={{ textAlign: "right" }}>Credit</th>
                  <th className="mono" style={{ textAlign: "right" }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No entries found</td></tr> :
                  rows.map(r => (
                    <tr key={r.id}>
                      <td className="mono" style={{ color: "#6B7280", fontSize: 12 }}>{r.date}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                      <td style={{ color: "#6B7280" }}>{r.category || "—"}</td>
                      <td className="mono" style={{ color: "#9CA3AF", fontSize: 11 }}>{r.reference || "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#DC2626" }}>{r.debit ? r.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#16A34A" }}>{r.credit ? r.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: r.balance >= 0 ? "#1F2937" : "#DC2626" }}>{r.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td><Tag label={r.status} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
