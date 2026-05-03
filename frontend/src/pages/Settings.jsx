import { useState } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Tag from "../components/ui/Tag.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";

export default function Settings({ user, setUser, toast }) {
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [cur, setCur] = useState(""); const [np, setNp] = useState("");
  const [saving, setSaving] = useState(false); const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try { const u = await API.updateProfile({ name, currency }); setUser(p => ({ ...p, ...u })); toast("Profile updated"); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changePw = async () => {
    setSavingPw(true);
    try { await API.changePassword(cur, np); toast("Password changed"); setCur(""); setNp(""); }
    catch (e) { toast(e.message, "error"); }
    finally { setSavingPw(false); }
  };

  return (
    <PageShell title="Settings">
      <div style={{ maxWidth: 560, display: "grid", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 20 }}>Profile</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Full Name</label><input className="inp" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label>Email</label><input className="inp" value={user?.email || ""} disabled style={{ opacity: .5 }} /></div>
            <div><label>Currency</label>
              <select className="inp" value={currency} onChange={e => setCurrency(e.target.value)}>
                {["USD","USD","EUR","GBP","AED","SGD"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="btn-primary" style={{ width: "fit-content" }} onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 20 }}>Change Password</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Current Password</label><PasswordInput value={cur} onChange={e => setCur(e.target.value)} /></div>
            <div><label>New Password</label><PasswordInput value={np} onChange={e => setNp(e.target.value)} /></div>
            <button className="btn-primary" style={{ width: "fit-content" }} onClick={changePw} disabled={savingPw}>{savingPw ? "Updating…" : "Update Password"}</button>
          </div>
        </Card>
        <Card style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>API Base URL</div>
              <div className="mono" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, wordBreak: "break-all" }}>{import.meta.env.VITE_API_URL || "http://localhost:5000"}</div>
            </div>
            <Tag label="connected" />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
