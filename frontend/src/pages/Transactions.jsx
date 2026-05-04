import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
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
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
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
    if (!editingTx?.id) return;
    setSaving(true);
    try {
      await API.updateTransaction(editingTx.id, { category: editForm.category, note: editForm.note });
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
    <PageShell title="Transactions" sub={`${txMeta?.total || 0} total records`}
      actions={
        user?.role !== "viewer" && (
          <div className="flex gap-3">
            <button className="btn-ghost text-[13px]" onClick={() => setShowImport(true)}>↑ Import CSV</button>
            <button className="btn-primary text-[13px]" onClick={() => setShowAdd(true)}>+ Add Transaction</button>
          </div>
        )
      }>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {[
          { key: "source", opts: ["", "bank", "internal"], labels: ["All Sources", "Bank", "Internal"] },
          { key: "status", opts: ["", "pending", "matched", "unmatched", "exception", "duplicate"], labels: ["All Status", "Pending", "Matched", "Unmatched", "Exception", "Duplicate"] },
        ].map(f => (
          <select key={f.key} className="inp w-auto py-1.5 px-3 min-w-[140px]"
            value={filter[f.key] || ""}
            onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value || undefined }))}>
            {f.opts.map((o, i) => <option key={o} value={o}>{f.labels[i]}</option>)}
          </select>
        ))}
        <div className="flex-1 min-w-[220px]">
          <input className="inp py-1.5 px-4" placeholder="Search description, reference…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="text-[12px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider"
          onClick={() => { setFilter({}); setSearch(""); }}>Clear Filters</button>
      </div>

      <Card className="p-0 overflow-hidden border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="w-32">Date</th>
                <th>Description</th>
                <th className="w-32">Source</th>
                <th className="w-32">Category</th>
                <th className="w-32">Reference</th>
                <th className="text-right w-40">Amount</th>
                <th className="w-32">Status</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5,6,7,8].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-20 rounded" /></td>
                    <td><div className="skeleton h-3 w-full max-w-[200px] rounded" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td><div className="skeleton h-3 w-12 rounded" /></td>
                    <td><div className="skeleton h-3 w-16 rounded" /></td>
                    <td className="text-right"><div className="skeleton h-3 w-20 rounded ml-auto" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td className="text-right"><div className="skeleton h-5 w-12 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">No transactions found</h3>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">Try adjusting your filters or import some records to get started.</p>
                      <button className="btn-primary w-full text-xs" onClick={() => setShowAdd(true)}>+ Add Your First Transaction</button>
                    </div>
                  </td>
                </tr>
              ) : (
                txs.map(t => (
                  <tr key={t.id ?? t._id} className="group hover:bg-gray-50 transition-colors">
                    <td className="mono text-gray-500 text-[12px]">{t.date}</td>
                    <td className="font-semibold text-gray-900 max-w-[240px] truncate">{t.description}</td>
                    <td><Tag label={t.source} /></td>
                    <td className="text-gray-500 text-[13px]">{t.category || "—"}</td>
                    <td className="mono text-gray-400 text-[11px]">{t.reference || "—"}</td>
                    <td className={`mono text-right font-bold tabular-nums ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.currency} {t.amount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td><Tag label={t.status} /></td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {user?.role !== "viewer" && (
                          <>
                            <button className="text-gray-400 hover:text-gray-900 p-1" onClick={() => openEdit(t)}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button className="text-gray-400 hover:text-red-600 p-1" onClick={() => handleDelete(t.id ?? t._id)}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {txMeta && txMeta.pages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
            Page {txMeta.page} of {txMeta.pages} &nbsp;·&nbsp; {txMeta.total} transactions
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost py-1.5 px-4 text-xs font-bold"
              disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>← Previous</button>
            <button className="btn-ghost py-1.5 px-4 text-xs font-bold"
              disabled={!txMeta.hasMore} onClick={() => setTxPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="New Transaction" onClose={() => setShowAdd(false)}>
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label>Date</label><input className="inp" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label>Currency</label><select className="inp" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
            </div>
            <div><label>Description</label><input className="inp" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Stripe Payout" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label>Amount</label><input className="inp font-bold" type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
              <div><label>Source</label><select className="inp" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}><option value="bank">Bank</option><option value="internal">Internal</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label>Reference</label><input className="inp mono" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="REF-XXXX" /></div>
              <div><label>Category</label><input className="inp" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Sales" /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="btn-ghost flex-1 font-bold" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1 font-bold" onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Create Transaction"}</button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Transactions" onClose={() => setShowImport(false)}>
          <div className="grid gap-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-[13px] text-blue-700 leading-relaxed">
              <span className="font-bold uppercase text-[10px] block mb-1 opacity-60 tracking-widest">Requirements</span>
              CSV must include: <code className="font-bold bg-white/60 px-1 rounded">date</code>, <code className="font-bold bg-white/60 px-1 rounded">description</code>, <code className="font-bold bg-white/60 px-1 rounded">amount</code>, <code className="font-bold bg-white/60 px-1 rounded">currency</code>, <code className="font-bold bg-white/60 px-1 rounded">reference</code>
            </div>
            <div>
              <label>Target Source</label>
              <select className="inp" value={importSource} onChange={e => setImportSource(e.target.value)}>
                <option value="bank">Bank (External)</option>
                <option value="internal">Internal (ERP/Books)</option>
              </select>
            </div>
            <div>
              <label>Select CSV File</label>
              <div className="relative h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImportFile(e.target.files[0])} />
                <svg className="w-8 h-8 text-gray-300 mb-2 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-widest">{importFile ? importFile.name : "Drop CSV here or click to browse"}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 font-bold" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary flex-1 font-bold" onClick={handleImport} disabled={saving || !importFile}>{saving ? "Importing…" : "Start Import"}</button>
            </div>
          </div>
        </Modal>
      )}

      {editingTx && (
        <Modal title="Edit Context" onClose={() => setEditingTx(null)}>
          <div className="grid gap-5">
            <div><label>Category</label><input className="inp" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. transfer" /></div>
            <div><label>Reconciliation Notes</label><textarea className="inp py-3" rows={4} value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} placeholder="Add reconciliation context..." style={{ resize: "none" }} /></div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 font-bold" onClick={() => setEditingTx(null)}>Cancel</button>
              <button className="btn-primary flex-1 font-bold" onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </Modal>
      )}

      {showUpgrade && (
        <Modal title="Plan Limit Reached" onClose={() => setShowUpgrade(false)}>
          <div className="text-center py-6 px-4">
            <div className="text-5xl mb-6">🚀</div>
            <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Upgrade for higher limits</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              You've reached the monthly transaction capacity for your current plan. Upgrade to Enterprise to unlock unlimited records and priority reconciliation.
            </p>
            <div className="flex flex-col gap-3">
              <button className="btn-primary w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 border-none font-bold" onClick={() => window.location.href = "/app/subscription"}>View Professional Plans</button>
              <button className="btn-ghost w-full py-3 font-bold border-none text-gray-400" onClick={() => setShowUpgrade(false)}>Maybe Later</button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
