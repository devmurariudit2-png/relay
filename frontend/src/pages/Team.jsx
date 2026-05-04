import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Tag from "../components/ui/Tag.jsx";

export default function Team({ user, toast }) {
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState({ email: "", role: "member" });
  const [saving, setSaving] = useState(false);

  const { data: r, isLoading: loading, error } = useQuery({
    queryKey: ['team'],
    queryFn: () => API.getTeamMembers({})
  });

  useEffect(() => {
    if (error) toast(error.message, "error");
  }, [error, toast]);

  const members = r?.data || (Array.isArray(r) ? r : []) || [];

  const sendInvite = async () => {
    toast("Team Invites are handled via Supabase Dashboard (Phase 2 Roadmap Feature)", "error");
  };

  const changeRole = async (id, role) => {
    try {
      await API.updateTeamMemberRole(id, role);
      queryClient.setQueryData(['team'], prev => {
        const arr = Array.isArray(prev) ? prev : prev?.data || prev?.members || [];
        return arr.map(m => (m._id === id ? { ...m, role } : m));
      });
      toast("Role updated");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const removeMember = async (id) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await API.removeTeamMember(id);
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast("Member removed");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <PageShell
      title="Team Management"
      sub={`${members.length} active members`}
      actions={user?.role !== "viewer" && (
        <div className="flex gap-2">
          <input className="inp py-1.5 px-4 text-sm min-w-[200px]" placeholder="invite@company.com" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} />
          <select className="inp py-1.5 px-3 text-sm w-32" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn-primary px-6 text-sm" onClick={sendInvite} disabled={saving}>{saving ? "Inviting…" : "Invite"}</button>
        </div>
      )}
    >
      <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th>Name</th>
                <th>Email</th>
                <th className="w-32">Role</th>
                <th className="w-32">Joined</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-32 rounded" /></td>
                    <td><div className="skeleton h-3 w-48 rounded" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td><div className="skeleton h-3 w-24 rounded" /></td>
                    <td className="text-right"><div className="skeleton h-5 w-16 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">No team members</p>
                      <p className="text-xs text-gray-500">Invite your colleagues to start collaborating.</p>
                    </div>
                  </td>
                </tr>
              ) : members.map(member => (
                <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                  <td className="font-semibold text-gray-900">{member.name || "Invited user"}</td>
                  <td className="text-gray-500 text-[12px]">{member.email}</td>
                  <td>
                    {user?.role === "admin" ? (
                      <select className="inp py-1 px-2 text-[11px] w-auto bg-white" value={member.role} onChange={e => changeRole(member._id, e.target.value)}>
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <Tag label={member.role} />
                    )}
                  </td>
                  <td className="text-gray-400 text-[12px]">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="text-right">
                    {user?.role === "admin" && (
                      <button className="text-gray-400 hover:text-red-600 p-1" onClick={() => removeMember(member._id)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
