import { useState, useEffect, useCallback } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Tag from "../components/ui/Tag.jsx";

export default function Team({ user, toast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({ email: "", role: "member" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const response = await API.getTeamMembers({ signal });
      setMembers(Array.isArray(response) ? response : response.data || response.members || []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      toast(e.message, "error");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const sendInvite = async () => {
    if (!invite.email.trim()) return;
    setSaving(true);
    try {
      await API.inviteTeamMember(invite.email.trim(), invite.role);
      toast("Team invite sent");
      setInvite({ email: "", role: "member" });
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await API.updateTeamMemberRole(id, role);
      setMembers(prev => prev.map(m => (m._id === id ? { ...m, role } : m)));
      toast("Role updated");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const removeMember = async (id) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await API.removeTeamMember(id);
      setMembers(prev => prev.filter(m => m._id !== id));
      toast("Member removed");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <PageShell
      title="Team Management"
      sub={`${members.length} members`}
      actions={user?.role !== "viewer" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="inp" placeholder="invite@company.com" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} style={{ width: 220, flex: "1 1 200px" }} />
          <select className="inp" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value }))} style={{ width: 120 }}>
            <option value="admin">admin</option>
            <option value="member">member</option>
            <option value="viewer">viewer</option>
          </select>
          <button className="btn-primary" onClick={sendInvite} disabled={saving}>{saving ? "Inviting…" : "Invite"}</button>
        </div>
      )}
    >
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No team members found</td></tr>
                ) : members.map(member => (
                  <tr key={member._id}>
                    <td style={{ fontWeight: 600, color: "#1F2937" }}>{member.name || "Invited user"}</td>
                    <td style={{ color: "#6B7280", fontSize: 12 }}>{member.email}</td>
                    <td>
                      {user?.role === "admin" ? (
                        <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }} value={member.role} onChange={e => changeRole(member._id, e.target.value)}>
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                          <option value="viewer">viewer</option>
                        </select>
                      ) : (
                        <Tag label={member.role} />
                      )}
                    </td>
                    <td style={{ color: "#9CA3AF", fontSize: 12 }}>{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}</td>
                    <td>{user?.role === "admin" && <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removeMember(member._id)}>Remove</button>}</td>
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
