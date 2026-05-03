import { useState } from "react";
import EyeIcon from "./EyeIcon.jsx";

export default function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input className="inp" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = "#374151"} onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>
        <EyeIcon visible={show} />
      </button>
    </div>
  );
}
