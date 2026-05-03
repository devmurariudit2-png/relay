import { useState, useEffect } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Card from "../components/ui/Card.jsx";
import Tag from "../components/ui/Tag.jsx";

export default function Ledger({ toast }) {
  const [source, setSource] = useState("bank");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.getLedger(source).then(setRows).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, [source]);

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
