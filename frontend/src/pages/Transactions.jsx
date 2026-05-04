import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Tag from "../components/ui/Tag.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";

export default function Transactions({ user, toast }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({});
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({ date: "", description: "", amount: "", currency: "USD", reference: "", source: "bank", category: "" });
  const [importFile, setImportFile] = useState(null);
  const [importSource, setImportSource] = useState("bank");
  const [saving, setSaving] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", note: "" });
  const [txPage, setTxPage] = useState(1);

  const { data: r, isLoading: loading, error } = useQuery({
    queryKey: ['transactions', filter, search, txPage],
    queryFn: () => API.getTransactions({ ...filter, search: search || undefined, page: txPage, limit: 50 })
  });

  useEffect(() => {
    if (error) toast(error.message, "error");
  }, [error, toast]);

  const txs = r?.txs || r?.data || (Array.isArray(r) ? r : []);
  const txMeta = r?.meta || (r ? { page: r.page, pages: Math.ceil(r.total / r.limit), total: r.total, hasMore: r.hasMore } : null);

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await API.createTransaction({ ...form, amount: parseFloat(form.amount) });
      toast("Transaction created"); setShowAdd(false);
      setForm({ date: "", description: "", amount: "", currency: "USD", reference: "", source: "bank", category: "" });
      load();
    } catch (e) {
      if (e.status === 402) {
        setShowAdd(false);
        setShowUpgrade(true);
      } else {
        toast(e.message, "error");
      }
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try { await API.deleteTransaction(id); toast("Deleted"); load(); }
    catch (e) { toast(e.message, "error"); }
  };
  
  const openEdit = (tx) => {
    setEditingTx(tx);
    setEditForm({ category: tx.category || "", note: tx.note || "" });
  };

  const handleUpdate = async () => {
    if (!editingTx?._id) return;
    setSaving(true);
    try {
      await API.updateTransaction(editingTx._id, { category: editForm.category, note: editForm.note });
      toast("Transaction updated");
      setEditingTx(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const handleImport = async () => {
    if (!importFile) return;
    setSaving(true);
    try {
      const r = await API.importCSV(importFile, importSource);
      toast(`Imported ${r.imported} transactions`); setShowImport(false); load();
    } catch (e) {
      if (e.status === 402) {
        setShowImport(false);
        setShowUpgrade(true);
      } else {
        toast(e.message, "error");
      }
    }
    finally { setSaving(false); }
  };

  return (
    <PageShell title="Transactions" sub={`${txs.length} records`}
      actions={
        user?.role !== "viewer" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowImport(true)}>↑ Import CSV</button>
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>+ Add Transaction</button>
          </div>
        )
      }>
      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[
          { key: "source", opts: ["", "bank", "internal"], labels: ["All Sources", "Bank", "Internal"] },
          { key: "status", opts: ["", "pending", "matched", "unmatched", "exception", "duplicate"], labels: ["All Status", "Pending", "Matched", "Unmatched", "Exception", "Duplicate"] },
        ].map(f => (
          <select key={f.key} className="inp" style={{ width: "auto", padding: "8px 12px" }}
            value={filter[f.key] || ""}
            onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value || undefined }))}>
            {f.opts.map((o, i) => <option key={o} value={o}>{f.labels[i]}</option>)}
          </select>
        ))}
        <input className="inp" placeholder="Search description, reference…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ minWidth: 220, flex: 1, padding: "8px 12px" }} />
        <button className="btn-ghost" style={{ fontSize: 12, padding: "8px 12px" }}
          onClick={() => { setFilter({}); setSearch(""); }}>Clear</button>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Source</th><th>Category</th><th>Reference</th><th className="mono" style={{ textAlign: "right" }}>Amount</th><th>Status</th><th>Actions</th><th /></tr></thead>
              <tbody>
                {txs.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No transactions found</td></tr> :
                  txs.map(t => (
                    <tr key={t._id}>
                      <td className="mono" style={{ color: "#6B7280" }}>{t.date}</td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                      <td><Tag label={t.source} /></td>
                      <td style={{ color: "#6B7280" }}>{t.category || "—"}</td>
                      <td className="mono" style={{ color: "#9CA3AF", fontSize: 12 }}>{t.reference || "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: t.amount >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>{t.currency} {t.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td><Tag label={t.status} /></td>
                       <td style={{ display: "flex", gap: 6 }}>
                        {user?.role !== "viewer" && (
                          <>
                            <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => openEdit(t)}>Edit</button>
                            <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => handleDelete(t._id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {txMeta && txMeta.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            Page {txMeta.page} of {txMeta.pages} &nbsp;·&nbsp; {txMeta.total} transactions
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>← Prev</button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={!txMeta.hasMore} onClick={() => setTxPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Transaction" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            {[
              { l: "Date", k: "date", type: "date" }, { l: "Description", k: "description" },
              { l: "Amount", k: "amount", type: "number" }, { l: "Currency", k: "currency" },
              { l: "Reference", k: "reference" }, { l: "Category", k: "category" },
            ].map(f => (
              <div key={f.k}><label>{f.l}</label><input className="inp" type={f.type || "text"} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} /></div>
            ))}
            <div>
              <label>Source</label>
              <select className="inp" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                <option value="bank">Bank</option><option value="internal">Internal</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Create"}</button>
            </div>
          </div>
        </Modal>
      )}

     {showImport && (
        <Modal title="Import CSV" onClose={() => setShowImport(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, border: "1px solid #E5E7EB", fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
              CSV must have columns: <span className="mono" style={{ color: "#7C3AED" }}>date, description, amount, currency, reference, category</span>
            </div>
            <div><label>Source</label>
              <select className="inp" value={importSource} onChange={e => setImportSource(e.target.value)}>
                <option value="bank">Bank</option><option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <label>CSV File</label>
              <input type="file" accept=".csv" className="inp" style={{ padding: "8px" }} onChange={e => setImportFile(e.target.files[0])} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleImport} disabled={saving || !importFile}>{saving ? "Importing…" : "Import"}</button>
            </div>
          </div>
        </Modal>
       )}

     {editingTx && (
       <Modal title="Edit Transaction" onClose={() => setEditingTx(null)}>
         <div style={{ display: "grid", gap: 14 }}>
           <div><label>Category</label><input className="inp" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. transfer" /></div>
           <div><label>Note</label><textarea className="inp" rows={4} value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} placeholder="Add reconciliation context..." style={{ resize: "vertical" }} /></div>
           <div style={{ display: "flex", gap: 10 }}>
             <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditingTx(null)}>Cancel</button>
             <button className="btn-primary" style={{ flex: 1 }} onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
           </div>
         </div>
       </Modal>
     )}

      {showUpgrade && (
        <Modal title="Plan Limit Reached" onClose={() => setShowUpgrade(false)}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h3 style={{ fontSize: 18, marginBottom: 10, color: "#1F2937" }}>You've reached your transaction limit</h3>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.5 }}>
              You've hit the monthly transaction ceiling for your current tier. Upgrade your plan to unlock higher limits and continue managing your finances without interruption!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowUpgrade(false)}>Not Now</button>
              <button className="btn-primary" style={{ flex: 1, background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", border: "none" }} onClick={() => window.location.href = "/app/subscription"}>View Pricing Plans</button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
