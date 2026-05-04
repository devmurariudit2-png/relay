import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase.js";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
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

  useEffect(() => {
    if (error) toast(error.message, "error");
  }, [error, toast]);

  const tickets = r?.tickets || r?.data || r || [];

  const load = () => { queryClient.invalidateQueries({ queryKey: ['tickets'] }); };

  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const updated = await API.updateTicket(selected.id ?? selected._id, { comment });
      setSelected(updated); setComment(""); toast("Comment added");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try { await API.updateTicket(id, { status }); toast("Status updated"); load(); if ((selected?.id ?? selected?._id) === id) setSelected(t => ({ ...t, status })); }
    catch (e) { toast(e.message, "error"); }
  };

  const removeTicket = async (id) => {
    if (!confirm("Delete this ticket?")) return;
    try {
      await API.deleteTicket(id);
      toast("Ticket deleted");
      if ((selected?.id ?? selected?._id) === id) setSelected(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <PageShell title="Support Tickets" sub={`${tickets.length} total tickets`}
      actions={user?.role !== "viewer" && <button className="btn-primary text-[13px]" onClick={() => setShowNew(true)}>+ New Ticket</button>}>
      <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th>Title</th>
                <th className="w-32">Priority</th>
                <th className="w-32">Category</th>
                <th className="w-32">Status</th>
                <th className="w-40">Created</th>
                <th className="w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-48 rounded" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td><div className="skeleton h-3 w-16 rounded" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td><div className="skeleton h-3 w-24 rounded" /></td>
                    <td className="text-right"><div className="skeleton h-5 w-24 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">No open tickets</h3>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">Need help with a transaction or account issue? Our team is here to help.</p>
                      <button className="btn-primary w-full text-xs" onClick={() => setShowNew(true)}>+ Create a Ticket</button>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id ?? t._id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(t)}>
                    <td className="font-semibold text-gray-900">{t.title}</td>
                    <td><Tag label={t.priority} /></td>
                    <td className="text-gray-500 text-[13px]">{t.category || "—"}</td>
                    <td><Tag label={t.status} /></td>
                    <td className="text-gray-400 text-[12px]">{new Date(t.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-3 justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {user?.role === "admin" && (
                          <select className="inp py-1 px-2 text-[11px] w-auto bg-white"
                            value={t.status} onChange={e => changeStatus(t.id ?? t._id, e.target.value)}>
                            {["open","in_progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {user?.role === "admin" && (
                          <button className="text-gray-400 hover:text-red-600 p-1" onClick={() => removeTicket(t.id ?? t._id)}>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
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

      {showNew && (
        <Modal title="New Support Ticket" onClose={() => setShowNew(false)}>
          <div className="grid gap-5">
            <div><label>Title</label><input className="inp" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Describe the issue…" /></div>
            <div><label>Description</label><textarea className="inp py-3" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide more details…" style={{ resize: "none" }} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label>Priority</label>
                <select className="inp" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div><label>Category</label>
                <select className="inp" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="other">Other</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="billing">Billing</option><option value="access">Access</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="btn-ghost flex-1 font-bold" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary flex-1 font-bold" onClick={create} disabled={saving}>{saving ? "Creating…" : "Submit Ticket"}</button>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} width={560}>
          <div className="grid gap-6">
            <div className="flex gap-2">
              <Tag label={selected.status} /><Tag label={selected.priority} />
              {selected.category && <Tag label={selected.category} />}
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-sm text-gray-700 leading-relaxed">{selected.description}</div>
            
            {/* Comments */}
            <div className="border-t border-gray-100 pt-6">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Conversation</div>
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {selected.comments?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-medium italic">No comments yet.</div>
                ) : (
                  selected.comments?.map((c, i) => (
                    <div key={i} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] font-black text-gray-900">{c.user?.name || "User"}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[13px] text-gray-600 leading-relaxed">{c.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {user?.role !== "viewer" && (
              <div className="pt-4">
                <label>Add Reply</label>
                <div className="flex gap-2">
                  <input className="inp flex-1" value={comment} onChange={e => setComment(e.target.value)} placeholder="Type your message..." onKeyDown={e => e.key === "Enter" && addComment()} />
                  <button className="btn-primary px-6" onClick={addComment} disabled={saving}>Send</button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
