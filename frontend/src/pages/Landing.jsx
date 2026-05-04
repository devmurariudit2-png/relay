import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/layout/Footer.jsx";
import DemoPlayer from "../components/DemoPlayer.jsx";

// ── Mini Dashboard Preview (for Hero) ────────────────────────────────────────
function HeroDashboardPreview() {
  return (
    <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(0,0,0,.08)", overflow: "hidden", animation: "fadeUp .8s .3s both" }}>
      {/* Mini header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>R</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>Dashboard</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>Live</span>
        </div>
      </div>
      {/* KPI row */}
      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {[
          { l: "Matched", v: "94%", c: "#16A34A" },
          { l: "Variance", v: "$0.00", c: "#16A34A" },
          { l: "Pending", v: "12", c: "#D97706" },
        ].map(m => (
          <div key={m.l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", border: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: m.c, letterSpacing: "-.5px" }}>{m.v}</div>
          </div>
        ))}
      </div>
      {/* Mini chart */}
      <div style={{ padding: "4px 16px 12px" }}>
        <svg viewBox="0 0 320 60" style={{ width: "100%", height: 60 }}>
          <defs>
            <linearGradient id="heroG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity=".15" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,45 L53,38 L106,30 L160,22 L213,18 L267,12 L320,8 L320,64 L0,64 Z" fill="url(#heroG)" />
          <path d="M0,45 L53,38 L106,30 L160,22 L213,18 L267,12 L320,8" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {/* Mini table */}
      <div style={{ padding: "0 16px 12px" }}>
        {[
          { ref: "REF-0042", desc: "Payment — Acme Corp", status: "matched", amt: "-$12,400" },
          { ref: "REF-0043", desc: "Invoice — Delta Inc", status: "matched", amt: "+$21,000" },
          { ref: "REF-0044", desc: "AWS Subscription", status: "pending", amt: "-$3,200" },
        ].map(r => (
          <div key={r.ref} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #F3F4F6", fontSize: 11 }}>
            <span style={{ fontFamily: "monospace", color: "#9CA3AF", width: 64 }}>{r.ref}</span>
            <span style={{ flex: 1, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 100, background: r.status === "matched" ? "#F0FDF4" : "#FFFBEB", color: r.status === "matched" ? "#16A34A" : "#D97706" }}>{r.status}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: r.amt.startsWith("+") ? "#16A34A" : "#DC2626", width: 72, textAlign: "right" }}>{r.amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing({ onEnter }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    const revealEls = document.querySelectorAll(".reveal");
    revealEls.forEach(el => el.classList.add("vis"));

    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct((window.scrollY / h) * 100);
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", fn);
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const FEATS = [
    { icon: "⇄", title: "Smart Matching", desc: "Automatically matches bank transactions with internal records by amount, reference and date. Sub-second reconciliation." },
    { icon: "↑", title: "CSV Bulk Import", desc: "Upload thousands of transactions at once from any bank CSV format. Intelligent field detection." },
    { icon: "≡", title: "Running Ledger", desc: "Real-time running balance ledger view with debit/credit columns and transaction status at a glance." },
    { icon: "◎", title: "Exception Engine", desc: "Automatically flags duplicates, unmatched items and anomalies. Never miss a discrepancy again." },
    { icon: "↗", title: "Live Analytics", desc: "Platform-wide analytics dashboard for admins — volume trends, user growth, reconciliation rates." },
    { icon: "◫", title: "Support Tickets", desc: "Built-in ticket system for users to raise issues. Admin assignment, comments, and status tracking." },
  ];

  const STEPS = [
    { n: "01", title: "Import Transactions", desc: "Upload CSV from your bank and internal system, or add transactions manually via the API." },
    { n: "02", title: "Run Reconciliation", desc: "One click — the engine matches, flags exceptions, detects duplicates, and generates a full report." },
    { n: "03", title: "Review & Resolve", desc: "Review the ledger, respond to exceptions via tickets, and export a clean reconciliation summary." },
  ];

  return (
    <div style={{ background: "#FFFFFF", color: "#111827", overflowX: "hidden", fontFamily: "Geist, sans-serif" }}>
      {/* Scroll bar */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 2000, height: 2, width: `${pct}%`, background: "linear-gradient(90deg,#EF4444,#F87171)", transition: "width .1s" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 2, left: 0, right: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6%", background: scrolled ? "rgba(255,255,255,.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid #E5E7EB" : "none", transition: "all .35s", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.4px", color: "#111827" }}>Relay</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <button style={{ background: "transparent", color: "#6B7280", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer" }} onClick={() => navigate("/app/api-docs")}>Docs</button>
          <button style={{ background: "transparent", color: "#6B7280", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer" }} onClick={onEnter}>Sign in</button>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={onEnter}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "92vh", display: "flex", alignItems: "center", padding: "100px 6% 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(239,68,68,.04) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 100%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 60, width: "100%", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {/* Left: copy */}
          <div style={{ flex: "1 1 400px", minWidth: 0 }}>
            <h1 className="fu1" style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-3px", marginBottom: 24, color: "#111827" }}>
              Bank ↔ Internal.<br />
              <span style={{ background: "linear-gradient(135deg,#EF4444,#F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reconciled.</span>
            </h1>

            <p className="fu2" style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.7, maxWidth: 480, marginBottom: 36, letterSpacing: "-.2px" }}>
              The engine that matches thousands of transactions in seconds, flags every exception, and gives your finance team a single source of truth.
            </p>

            <div className="fu3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={onEnter}>Start reconciling today</button>
            </div>

            <div className="fu4" style={{ display: "flex", gap: 32, marginTop: 44, paddingTop: 28, borderTop: "1px solid #E5E7EB", flexWrap: "wrap" }}>
              {[["∞", "Transactions matched"], ["< 1s", "Reconciliation speed"], ["100%", "Audit trail coverage"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444", letterSpacing: "-1px" }}>{v}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="fu2" style={{ flex: "1 1 400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA", padding: "12px 0" }}>
        <div style={{ animation: "marq 25s linear infinite", whiteSpace: "nowrap", display: "inline-block" }}>
          {[1, 2, 3].map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, color: "#D1D5DB", letterSpacing: ".5px", paddingRight: 0 }}>CSV Import · Bank Reconciliation · Exception Flagging · Ledger View · Audit Logs · Role-based Access · Real-time Analytics · Ticket Management · </span>)}
        </div>
      </div>

      {/* Product Demo Section */}
      <section style={{ padding: "100px 6%", textAlign: "center" }}>
        <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 16, color: "#111827" }}>
          See it in action
        </h2>
        <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
          Watch how Relay processes a real CSV import, runs the matching engine, and generates a full reconciliation report in under 30 seconds.
        </p>

        <div className="reveal rd2">
          <DemoPlayer />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 6%", background: "#FAFAFA" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 14, color: "#111827" }}>
              Everything your finance team needs.
            </h2>
            <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", maxWidth: 440, margin: "0 auto" }}>Purpose-built for reconciliation. Every feature earns its place.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {FEATS.map((f, i) => (
              <div key={f.title} className={`reveal rd${(i % 4) + 1}`} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "26px", transition: "all .3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,.3)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(239,68,68,.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 40, height: 40, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 18, color: "#EF4444" }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#1F2937" }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "100px 6%" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-2.5px", color: "#111827" }}>How it works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, position: "relative" }}>
            <div style={{ position: "absolute", top: "30%", left: "16.6%", right: "16.6%", height: 1, background: "linear-gradient(90deg,transparent,#D1D5DB,#EF4444,#D1D5DB,transparent)", pointerEvents: "none" }} />
            {STEPS.map((s, i) => (
              <div key={s.n} className={`reveal rd${i + 1}`} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "28px", textAlign: "center", position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: 11, fontFamily: "Geist Mono", color: "#EF4444", fontWeight: 700, marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "100px 6%", background: "#FAFAFA" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-2.5px", color: "#111827", marginBottom: 14 }}>Simple, transparent pricing</h2>
            <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", maxWidth: 440, margin: "0 auto" }}>Start for free, scale when you need to.</p>
          </div>
          <div className="reveal rd2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, padding: "20px 0" }}>
            {[
              { title: "Free", price: "$0", desc: "Perfect for exploring the platform.", features: ["Up to 10,000 transactions/mo", "Basic CSV import", "Community support"], btn: "Get Started Free", popular: false },
              { title: "Starter", price: "$299", period: "/mo", desc: "For growing teams that need more power.", features: ["Up to 50,000 transactions/mo", "API Access", "Advanced matching rules", "Priority support"], btn: "Start Free Trial", popular: false },
              { title: "Growth", price: "$999", period: "/mo", desc: "For scaling businesses with high volume.", features: ["Up to 250,000 transactions/mo", "Custom webhooks", "Dedicated account manager", "SLA guarantee"], btn: "Upgrade to Growth", popular: true },
              { title: "Scale", price: "$3,499", period: "/mo", desc: "For large organizations with complex needs.", features: ["Up to 1,000,000 transactions/mo", "Custom integrations", "On-prem deployment options", "24/7 Phone Support"], btn: "Contact Sales", popular: false },
            ].map(p => (
              <div key={p.title} style={{ background: "#FFFFFF", border: p.popular ? "2px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 16, padding: "32px", position: "relative", boxShadow: p.popular ? "0 20px 40px rgba(239,68,68,.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)", transform: p.popular ? "scale(1.02)" : "scale(1)", display: "flex", flexDirection: "column" }}>
                {p.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#EF4444,#F87171)", color: "#FFF", fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 100, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Most Popular</div>}
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", marginBottom: 8 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: "#111827", letterSpacing: "-1.5px" }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 15, color: "#6B7280" }}>{p.period}</span>}
                </div>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28, lineHeight: 1.6 }}>{p.desc}</p>
                <div style={{ flex: 1, marginBottom: 32 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A", flexShrink: 0 }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: 14, color: "#4B5563" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className={p.popular ? "btn-primary" : ""} style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, borderRadius: 10, background: p.popular ? undefined : "#F3F4F6", color: p.popular ? undefined : "#1F2937", border: p.popular ? "none" : "1px solid #E5E7EB", cursor: "pointer", transition: "all .2s" }} onClick={onEnter} onMouseEnter={e => !p.popular && (e.currentTarget.style.background = "#E5E7EB")} onMouseLeave={e => !p.popular && (e.currentTarget.style.background = "#F3F4F6")}>{p.btn}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "90px 6%", textAlign: "center" }}>
        <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-3px", marginBottom: 16, color: "#111827" }}>Start reconciling today.</h2>
        <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>Free to start. No credit card. Deploy in minutes on your own infrastructure.</p>
        <div className="reveal rd2" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }} onClick={onEnter}>Get started free</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
