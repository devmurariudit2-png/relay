// DemoPlayer.jsx
// Self-contained animated product tour — White/Light theme.
// Each "frame" is a React component that auto-advances.
// Drop this into the landing page as: <DemoPlayer />

import { useState, useEffect, useRef } from "react";

// ── Frame data ────────────────────────────────────────────────────────────────
const FRAMES = [
  { id: "import",      label: "01  Import CSV",       duration: 4000 },
  { id: "reconcile",   label: "02  Run Reconcile",    duration: 3500 },
  { id: "results",     label: "03  View Results",     duration: 4000 },
  { id: "ledger",      label: "04  Ledger View",      duration: 3500 },
  { id: "dashboard",   label: "05  Dashboard",        duration: 4000 },
];

// ── Frame components ──────────────────────────────────────────────────────────
function FrameImport({ progress }) {
  const rows = [
    { ref:"REF-0001", desc:"Opening Balance",              amt:"+50,000.00", done: progress > 15 },
    { ref:"REF-0002", desc:"Vendor Payment - Acme",        amt:"-12,400.00", done: progress > 28 },
    { ref:"REF-0003", desc:"Client Receipt - Delta",       amt:"+21,000.00", done: progress > 42 },
    { ref:"REF-0004", desc:"Office Rent Payment",          amt:"-8,500.00",  done: progress > 56 },
    { ref:"REF-0005", desc:"AWS Subscription",             amt:"-3,200.00",  done: progress > 68 },
    { ref:"REF-0006", desc:"Focal Inc Invoice",            amt:"+18,000.00", done: progress > 80 },
    { ref:"REF-0007", desc:"Payroll November",             amt:"-45,000.00", done: progress > 90 },
  ];
  const done = rows.filter(r => r.done).length;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, height:"100%" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1F2937" }}>Import CSV Transactions</div>
          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>Source: Bank · USD</div>
        </div>
        <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:8, padding:"6px 14px", fontSize:12, color:"#EF4444", fontWeight:600 }}>
          {done}/{rows.length} imported
        </div>
      </div>
      <div style={{ height:3, background:"#F3F4F6", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#EF4444,#F87171)", transition:"width .1s" }} />
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        {rows.map((r, i) => (
          <div key={r.ref} style={{ display:"grid", gridTemplateColumns:"90px 1fr 90px 28px", gap:10, padding:"8px 20px", alignItems:"center", opacity: r.done ? 1 : 0.25, transition:"opacity .4s", borderBottom:"1px solid #F3F4F6" }}>
            <span style={{ fontSize:11, fontFamily:"monospace", color:"#9CA3AF" }}>{r.ref}</span>
            <span style={{ fontSize:12, color:"#4B5563" }}>{r.desc}</span>
            <span style={{ fontSize:12, fontFamily:"monospace", textAlign:"right", color: r.amt.startsWith("+") ? "#16A34A" : "#DC2626", fontWeight:600 }}>{r.amt}</span>
            <span style={{ fontSize:14, color: r.done ? "#16A34A" : "#D1D5DB", textAlign:"center" }}>{r.done ? "✓" : "○"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameReconcile({ progress }) {
  const phase = progress < 30 ? "scanning" : progress < 60 ? "matching" : progress < 85 ? "flagging" : "done";
  const logs = [
    { t:5,  col:"#6B7280",  msg:"Loading bank transactions…" },
    { t:15, col:"#6B7280",  msg:"Loading internal transactions…" },
    { t:28, col:"#EF4444",  msg:"Matching by reference REF-0001 → ✓ matched" },
    { t:35, col:"#EF4444",  msg:"Matching by reference REF-0002 → ✓ matched" },
    { t:42, col:"#EF4444",  msg:"Matching by reference REF-0003 → ✓ matched" },
    { t:52, col:"#D97706",  msg:"REF-0010 → amount mismatch [$250 vs $275] → exception" },
    { t:62, col:"#DC2626",  msg:"REF-9999 → no bank record → unmatched" },
    { t:72, col:"#EF4444",  msg:"Matched 13/15 bank transactions" },
    { t:82, col:"#DC2626",  msg:"1 exception · 1 unmatched flagged" },
    { t:90, col:"#16A34A",  msg:"Reconciliation complete ✓" },
  ];
  const visible = logs.filter(l => l.t <= progress);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, height:"100%" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background: phase === "done" ? "#16A34A" : "#EF4444", animation: phase !== "done" ? "pulse 1s infinite" : "none" }} />
        <div style={{ fontSize:14, fontWeight:700, color:"#1F2937" }}>
          {phase === "scanning" ? "Scanning transactions…" : phase === "matching" ? "Matching records…" : phase === "flagging" ? "Flagging exceptions…" : "Reconciliation complete"}
        </div>
      </div>
      <div style={{ height:3, background:"#F3F4F6", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#EF4444,#16A34A)", transition:"width .15s" }} />
      </div>
      <div style={{ flex:1, padding:"12px 20px", overflowY:"auto", fontFamily:"monospace" }}>
        {visible.map((l, i) => (
          <div key={i} style={{ fontSize:12, color:l.col, marginBottom:6, animation:"fadeIn .3s both" }}>
            <span style={{ color:"#D1D5DB", margUSDight:8 }}>{">"}</span>{l.msg}
          </div>
        ))}
        {phase !== "done" && (
          <div style={{ fontSize:12, color:"#9CA3AF", animation:"pulse 1s infinite" }}>▌</div>
        )}
      </div>
    </div>
  );
}

function FrameResults({ progress }) {
  const show = progress > 20;
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #E5E7EB" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1F2937" }}>Reconciliation Results</div>
        <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>Nov 2024 · 15 bank  ↔  16 internal</div>
      </div>
      <div style={{ flex:1, padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            { l:"Matched",    v:"13", c:"#16A34A", bg:"#F0FDF4" },
            { l:"Exceptions", v:"1",  c:"#D97706", bg:"#FFFBEB" },
            { l:"Unmatched",  v:"1",  c:"#DC2626", bg:"#FEF2F2" },
          ].map(m => (
            <div key={m.l} style={{ background:m.bg, border:`1px solid ${m.c}22`, borderRadius:10, padding:"12px 14px", opacity: show ? 1 : 0, transition:"opacity .5s", transitionDelay: m.l === "Matched" ? "0s" : m.l === "Exceptions" ? ".2s" : ".4s" }}>
              <div style={{ fontSize:10, color:m.c, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{m.l}</div>
              <div style={{ fontSize:26, fontWeight:800, color:m.c, letterSpacing:"-1px" }}>{m.v}</div>
            </div>
          ))}
        </div>
        {progress > 55 && (
          <div style={{ background:"#FFFBEB", border:"1px solid rgba(217,119,6,.2)", borderRadius:10, padding:"14px 16px", animation:"fadeIn .4s both" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#D97706", marginBottom:8 }}>⚠ Exception — REF-0010</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12 }}>
              <div style={{ color:"#6B7280" }}>Bank amount: <span style={{ color:"#1F2937", fontFamily:"monospace" }}>$250.00</span></div>
              <div style={{ color:"#6B7280" }}>Internal: <span style={{ color:"#1F2937", fontFamily:"monospace" }}>$275.00</span></div>
              <div style={{ color:"#6B7280" }}>Difference: <span style={{ color:"#D97706", fontFamily:"monospace" }}>$25.00</span></div>
              <div style={{ color:"#6B7280" }}>Action: <span style={{ color:"#EF4444" }}>Raise ticket →</span></div>
            </div>
          </div>
        )}
        {progress > 75 && (
          <div style={{ background:"#FEF2F2", border:"1px solid rgba(220,38,38,.15)", borderRadius:10, padding:"14px 16px", animation:"fadeIn .4s both" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#DC2626", marginBottom:8 }}>✗ Unmatched — REF-9999</div>
            <div style={{ fontSize:12, color:"#6B7280" }}>Internal transfer of <span style={{ color:"#1F2937", fontFamily:"monospace" }}>$2,500.00</span> has no matching bank entry.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FrameLedger({ progress }) {
  const ledger = [
    { date:"Nov 01", desc:"Opening Balance",      credit:"50,000.00", debit:null,       bal:"50,000.00",  s:"matched"   },
    { date:"Nov 02", desc:"Acme Supplies",         credit:null,        debit:"12,400.00",bal:"37,600.00",  s:"matched"   },
    { date:"Nov 03", desc:"Delta Systems Receipt", credit:"21,000.00", debit:null,       bal:"58,600.00",  s:"matched"   },
    { date:"Nov 04", desc:"Office Rent",           credit:null,        debit:"8,500.00", bal:"50,100.00",  s:"matched"   },
    { date:"Nov 05", desc:"AWS Subscription",      credit:null,        debit:"3,200.00", bal:"46,900.00",  s:"matched"   },
    { date:"Nov 06", desc:"Focal Inc Invoice",     credit:"18,000.00", debit:null,       bal:"64,900.00",  s:"matched"   },
    { date:"Nov 07", desc:"Payroll",               credit:null,        debit:"45,000.00",bal:"19,900.00",  s:"matched"   },
    { date:"Nov 10", desc:"Bank Charges",          credit:null,        debit:"250.00",   bal:"19,650.00",  s:"exception" },
  ];
  const visible = Math.min(ledger.length, Math.floor((progress / 100) * ledger.length) + 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1F2937" }}>Bank Ledger — November 2024</div>
        <div style={{ fontSize:12, color:"#16A34A", fontWeight:600, fontFamily:"monospace" }}>Balance: $19,650.00</div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
              {["Date","Description","Debit","Credit","Balance","Status"].map(h => (
                <th key={h} style={{ padding:"8px 12px", color:"#9CA3AF", fontWeight:700, textAlign: h === "Debit" || h === "Credit" || h === "Balance" ? "right" : "left", textTransform:"uppercase", letterSpacing:".4px", fontSize:10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.slice(0, visible).map((r, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #F3F4F6", animation:"slideIn .3s both" }}>
                <td style={{ padding:"8px 12px", color:"#9CA3AF", fontFamily:"monospace" }}>{r.date}</td>
                <td style={{ padding:"8px 12px", color:"#4B5563", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.desc}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", color:"#DC2626", fontFamily:"monospace" }}>{r.debit || "—"}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", color:"#16A34A", fontFamily:"monospace" }}>{r.credit || "—"}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", fontWeight:700, color:"#1F2937", fontFamily:"monospace" }}>{r.bal}</td>
                <td style={{ padding:"8px 12px" }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:100, background: r.s === "matched" ? "#F0FDF4" : "#FFFBEB", color: r.s === "matched" ? "#16A34A" : "#D97706" }}>{r.s}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FrameDashboard({ progress }) {
  const show = (n) => progress > n;
  const revData = [64, 79, 95, 112, 131, 149];
  const W = 320, H = 80;
  const max = Math.max(...revData), mn = Math.min(...revData) * .9;
  const pts = revData.map((v, i) => ({ x: (i / (revData.length - 1)) * W, y: H - ((v - mn) / (max - mn)) * (H * .85) - H * .075 }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length-1].x},${H+4} L0,${H+4} Z`;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"16px 20px", gap:14, overflowY:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {[
          { l:"Revenue",   v:"$1.49L", c:"#2563EB", show:15 },
          { l:"Matched",   v:"87%",    c:"#16A34A", show:25 },
          { l:"Variance",  v:"$0.00",  c:"#16A34A", show:35 },
          { l:"Tickets",   v:"2 open", c:"#D97706", show:45 },
        ].map(m => (
          <div key={m.l} style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, padding:"10px 12px", opacity: show(m.show) ? 1 : 0, transition:"opacity .5s", transitionDelay:".1s" }}>
            <div style={{ fontSize:9, color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", marginBottom:6 }}>{m.l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:m.c, letterSpacing:"-.5px" }}>{m.v}</div>
          </div>
        ))}
      </div>

      {show(50) && (
        <div style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:10, padding:"14px", animation:"fadeIn .5s both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1F2937" }}>Revenue Trend</div>
            <div style={{ fontSize:11, color:"#16A34A", fontWeight:600 }}>↑ 13.4%</div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:80 }}>
            <defs>
              <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity=".2" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#dg)" />
            <path d={line} fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#EF4444" strokeWidth="2" />)}
          </svg>
          <div style={{ display:"flex", justifyContent:"space-around", marginTop:4 }}>
            {["Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m} style={{ fontSize:9, color:"#D1D5DB", fontWeight:600 }}>{m}</span>)}
          </div>
        </div>
      )}

      {show(70) && (
        <div style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:10, padding:"14px", animation:"fadeIn .5s both" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1F2937", marginBottom:10 }}>Status Breakdown</div>
          {[
            { l:"matched",    pct:87, c:"#16A34A" },
            { l:"pending",    pct:6,  c:"#6B7280" },
            { l:"exception",  pct:4,  c:"#D97706" },
            { l:"unmatched",  pct:3,  c:"#DC2626" },
          ].map(s => (
            <div key={s.l} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:10, color:s.c, fontWeight:600, width:72, flexShrink:0 }}>{s.l}</span>
              <div style={{ flex:1, height:4, background:"#E5E7EB", borderRadius:2 }}>
                <div style={{ width:`${s.pct}%`, height:"100%", background:s.c, borderRadius:2, transition:"width 1s" }} />
              </div>
              <span style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace", width:28, textAlign:"right" }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DemoPlayer ─────────────────────────────────────────────────────────────────
export default function DemoPlayer() {
  const [frameIdx, setFrameIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef();
  const startRef = useRef(null);

  const frame = FRAMES[frameIdx];

  useEffect(() => {
    if (!playing) return;
    startRef.current = null;
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min((elapsed / frame.duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setFrameIdx(i => (i + 1) % FRAMES.length);
          setProgress(0);
        }, 600);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frameIdx, playing]);

  const go = (i) => { setFrameIdx(i); setProgress(0); };

  const FrameComponent =
    frame.id === "import"    ? FrameImport    :
    frame.id === "reconcile" ? FrameReconcile :
    frame.id === "results"   ? FrameResults   :
    frame.id === "ledger"    ? FrameLedger    : FrameDashboard;

  return (
    <div style={{ width:"100%", maxWidth:900, margin:"0 auto", borderRadius:16, overflow:"hidden", border:"1px solid #E5E7EB", background:"#FFFFFF", boxShadow:"0 20px 60px rgba(0,0,0,.08)" }}>
      {/* Browser chrome */}
      <div style={{ height:38, background:"#F9FAFB", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", padding:"0 14px", gap:10 }}>
        <div style={{ display:"flex", gap:5 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}
        </div>
        <div style={{ flex:1, maxWidth:240, margin:"0 auto", background:"#FFFFFF", borderRadius:5, height:20, border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#9CA3AF", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#16A34A", animation:"pulse 2.5s infinite" }} />
          app.reconciler.io
        </div>
        <button onClick={() => setPlaying(p => !p)}
          style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:5, color:"#6B7280", fontSize:12, padding:"3px 10px", lineHeight:1 }}>
          {playing ? "⏸" : "▶"}
        </button>
      </div>

      {/* Step tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #E5E7EB", background:"#FAFAFA", overflowX:"auto" }}>
        {FRAMES.map((f, i) => (
          <button key={f.id} onClick={() => go(i)}
            style={{ flex:1, padding:"10px 12px", fontSize:11, fontWeight: i === frameIdx ? 700 : 400, color: i === frameIdx ? "#EF4444" : "#9CA3AF", background: i === frameIdx ? "rgba(239,68,68,.05)" : "transparent", border:"none", borderBottom: i === frameIdx ? "2px solid #EF4444" : "2px solid transparent", transition:"all .2s", whiteSpace:"nowrap" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Progress strip */}
      <div style={{ height:2, background:"#F3F4F6" }}>
        <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#EF4444,#F87171)", transition:"width .05s" }} />
      </div>

      {/* Frame area */}
      <div style={{ height:340, overflow:"hidden" }}>
        <FrameComponent progress={progress} />
      </div>

      {/* Footer */}
      <div style={{ padding:"10px 20px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FAFAFA" }}>
        <div style={{ display:"flex", gap:6 }}>
          {FRAMES.map((f, i) => (
            <div key={f.id} onClick={() => go(i)}
              style={{ width: i === frameIdx ? 20 : 6, height:6, borderRadius:3, background: i === frameIdx ? "#EF4444" : i < frameIdx ? "#16A34A" : "#E5E7EB", cursor:"pointer", transition:"all .3s" }} />
          ))}
        </div>
        <span style={{ fontSize:11, color:"#9CA3AF" }}>
          Step {frameIdx + 1} of {FRAMES.length} · {frame.label.split("  ")[1]}
        </span>
      </div>
    </div>
  );
}
