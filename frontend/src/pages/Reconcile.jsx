import { useState } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Metric from "../components/ui/Metric.jsx";
import { fmt } from "../utils/format.js";

export default function Reconcile({ toast }) {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

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
    if (!result) return;
    const rows = [
      ["status", result.status || ""],
      ["matched", result.matched ?? 0],
      ["unmatched", result.unmatched ?? 0],
      ["exceptions", result.exceptions ?? 0],
      ["bank_total", result.bank_total ?? 0],
      ["internal_total", result.internal_total ?? 0],
      ["variance", result.variance ?? 0],
      ["generated_at", new Date().toISOString()],
    ];
    const csv = rows.map(([k, v]) => `${k},${JSON.stringify(v)}`).join("\n");
    downloadFile(`reconciliation-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportPDF = () => {
    if (!result) return;
    const text = [
      "RECONCILIATION REPORT",
      "====================",
      `Status: ${result.status || "UNKNOWN"}`,
      `Matched: ${result.matched ?? 0}`,
      `Unmatched: ${result.unmatched ?? 0}`,
      `Exceptions: ${result.exceptions ?? 0}`,
      `Bank Total: ${result.bank_total ?? 0}`,
      `Internal Total: ${result.internal_total ?? 0}`,
      `Variance: ${result.variance ?? 0}`,
      `Generated At: ${new Date().toISOString()}`,
    ].join("\n");
    const pdfBytes = buildSimplePdf(text);
    downloadFile(`reconciliation-report-${new Date().toISOString().slice(0, 10)}.pdf`, pdfBytes, "application/pdf");
  };
 
  const run = async () => {
    setRunning(true); setResult(null);
    try { const r = await API.reconcile(); setResult(r); toast("Reconciliation complete!"); }
    catch (e) { toast(e.message, "error"); }
    finally { setRunning(false); }
  };

  return (
    <PageShell title="Reconciliation Engine" sub="Match bank ↔ internal transactions automatically">
      <div style={{ maxWidth: 700 }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Run Reconciliation</div>
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Compares all bank and internal transactions, matches by amount+reference, and flags exceptions.</div>
            </div>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14, minWidth: 140 }} onClick={run} disabled={running}>
              {running ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={14} color="#fff" />Running…</div> : "▶ Run now"}
            </button>
          </div>
        </Card>

         {result && (
         <div className="fi">
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
             <Metric label="Matched"   value={result.matched   ?? 0} color="#16A34A" icon="✓" />
             <Metric label="Unmatched" value={result.unmatched ?? 0} color="#DC2626" icon="✗" />
             <Metric label="Exceptions"value={result.exceptions?? 0} color="#D97706" icon="!" />
             <Metric label="Status" value={result.status || (Math.abs(result.variance || 0) < 1 ? "BALANCED" : "VARIANCE DETECTED")} color={Math.abs(result.variance || 0) < 1 ? "#16A34A" : "#DC2626"} icon="◎" />
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
             <Metric label="Bank Total" value={fmt(result.bank_total)} color="#2563EB" />
             <Metric label="Internal Total" value={fmt(result.internal_total)} color="#7C3AED" />
             <Metric label="Variance" value={fmt(result.variance)} color={Math.abs(result.variance || 0) < 1 ? "#16A34A" : "#DC2626"} />
           </div>
           <Card>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
               <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Summary</div>
               <div style={{ display: "flex", gap: 8 }}>
                 <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportCSV}>Download CSV</button>
                 <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportPDF}>Download PDF</button>
               </div>
             </div>
             <pre style={{ fontFamily: "Geist Mono", fontSize: 12, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: 16, overflow: "auto", border: "1px solid #E5E7EB", maxHeight: 320, whiteSpace: "pre-wrap" }}>
               {JSON.stringify(result, null, 2)}
             </pre>
               
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
