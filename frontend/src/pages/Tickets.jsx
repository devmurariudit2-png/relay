import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase.js";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Tag from "../components/ui/Tag.jsx";
import Modal from "../components/ui/Modal.jsx";

export default function Tickets({ user, toast }) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "" });
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: r, isLoading: loading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => API.getTickets({ limit: 50 })
  });

  if (error) { toast(error.message, "error"); }

  const tickets = r?.data || r || [];

  const load = () => { queryClient.invalidateQueries({ queryKey: ['tickets'] }); };

  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        load(); // Instantly refresh tickets when DB changes
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const create = async () => {
    setSaving(true);
    try { await API.createTicket(form); toast("Ticket created"); setShowNew(false); setForm({ title: "", description: "", priority: "medium", category: "" }); load(); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const updated = await API.updateTicket(selected._id, { comment });
      setSelected(updated); setComment(""); toast("Comment added");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try { await API.updateTicket(id, { status }); toast("Status updated"); load(); if (selected?._id === id) setSelected(t => ({ ...t, status })); }
    catch (e) { toast(e.message, "error"); }
  };

  const removeTicket = async (id) => {
    if (!confirm("Delete this ticket?")) return;
    try {
      await API.deleteTicket(id);
      toast("Ticket deleted");
      if (selected?._id === id) setSelected(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <PageShell title="Support Tickets" sub={`${tickets.length} tickets`}
      actions={user?.role !== "viewer" && <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ New Ticket</button>}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Title</th><th>Priority</th><th>Category</th><th>Status</th><th>Created</th><th>Actions</th><th /></tr></thead>
              <tbody>
                {tickets.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No tickets</td></tr> :
                  tickets.map(t => (
                    <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                      <td style={{ fontWeight: 600, color: "#1F2937" }}>{t.title}</td>
                      <td><Tag label={t.priority} /></td>
                      <td style={{ color: "#6B7280" }}>{t.category || "—"}</td>
                      <td><Tag label={t.status} /></td>
                      <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {user?.role === "admin" && (
                            <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                              value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); changeStatus(t._id, e.target.value); }}>
                              {["open","in-progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                          {user?.role === "admin" && (
                            <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); removeTicket(t._id); }}>
                              Delete
                            </button>
                          )}      
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showNew && (
        <Modal title="New Ticket" onClose={() => setShowNew(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Title</label><input className="inp" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Describe the issue…" /></div>
            <div><label>Description</label><textarea className="inp" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide more details…" style={{ resize: "vertical" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <div><label>Priority</label>
                <select className="inp" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
               <div><label>Category</label><select className="inp" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}><option value="other">Other</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="billing">Billing</option><option value="access">Access</option></select></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={create} disabled={saving}>{saving ? "Creating…" : "Create Ticket"}</button>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={`Ticket — ${selected.title}`} onClose={() => setSelected(null)} width={560}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label={selected.status} /><Tag label={selected.priority} />
              {selected.category && <Tag label={selected.category} />}
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, fontSize: 13, color: "#4B5563", lineHeight: 1.7, border: "1px solid #E5E7EB" }}>{selected.description}</div>
            {/* Comments */}
            {selected.comments?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Comments ({selected.comments.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.comments.map((c, i) => (
                    <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", border: "1px solid #E5E7EB" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{c.user?.name || "User"} · {new Date(c.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 13, color: "#4B5563" }}>{c.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {user?.role !== "viewer" && (
              <div>
                <label>Add Comment</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="inp" style={{ flex: "1 1 200px" }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment…" onKeyDown={e => e.key === "Enter" && addComment()} />
                  <button className="btn-primary" onClick={addComment} disabled={saving}>Post</button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
