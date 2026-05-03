import { useState, useEffect } from "react";
import * as API from "../api/index.js";
import PageShell from "../components/layout/PageShell.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Tag from "../components/ui/Tag.jsx";

export default function Subscription({ user, toast }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchSub = () => {
      API.getSubscriptionStatus()
        .then(r => {
          setSub(prev => {
            // If tier changed, maybe toast it if we were waiting
            return r.data || r;
          });
        })
        .catch(e => console.error(e))
        .finally(() => setLoading(false));
    };

    fetchSub();

    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) toast("Processing payment... your plan will update momentarily.", "success");
    if (params.get("canceled")) toast("Subscription update canceled.", "error");

    // Polling removed to prevent excessive API calls in production
  }, [toast]);

  const handleUpgrade = async (tier) => {
    setProcessing(true);
    try {
      const res = await API.createCheckoutSession(tier);
      window.location.href = res.url;
    } catch (e) {
      toast(e.message, "error");
      setProcessing(false);
    }
  };

  const handleManage = async () => {
    setProcessing(true);
    try {
      const res = await API.createPortalSession();
      window.location.href = res.url;
    } catch (e) {
      toast(e.message, "error");
      setProcessing(false);
    }
  };

  if (loading) return <PageShell title="Subscription"><div style={{ padding: 40, textAlign: "center" }}><Spinner /></div></PageShell>;

  const limits = { free: 10000, starter: 50000, growth: 250000, scale: 1000000, enterprise: "Unlimited" };
  const currentLimit = limits[sub?.tier] || 10000;

  return (
    <PageShell title="Subscription & Billing" sub="Manage your plan and limits">
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* Current Plan Overview */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Current Plan</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 700, textTransform: "capitalize" }}>{sub?.tier || "Free"}</span>
              <Tag label={sub?.status === "active" ? "active" : sub?.status || "inactive"} />
            </div>
          </div>
          
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, border: "1px solid #E5E7EB", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Transactions used this month</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{(sub?.transactionsUsedThisMonth || 0).toLocaleString()} / {currentLimit === "Unlimited" ? "Unlimited" : currentLimit.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                background: (sub?.transactionsUsedThisMonth || 0) >= (currentLimit === "Unlimited" ? Infinity : currentLimit) ? "#DC2626" : "#3B82F6", 
                width: currentLimit === "Unlimited" ? "0%" : `${Math.min(100, ((sub?.transactionsUsedThisMonth || 0) / currentLimit) * 100)}%` 
              }} />
            </div>
          </div>

          {sub?.stripeCustomerId && (
            <button className="btn-ghost" style={{ width: "100%" }} onClick={handleManage} disabled={processing}>
              {processing ? "Loading..." : "Manage Billing & Invoices"}
            </button>
          )}
        </Card>

        {/* Pricing Cards */}
        <Card>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Starter</h3>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Up to 50,000 transactions/month.</p>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>$299 <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 400 }}>/ mo</span></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleUpgrade('starter')} disabled={processing || sub?.tier === "starter"}>
            {sub?.tier === "starter" ? "Current Plan" : "Upgrade to Starter"}
          </button>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Growth</h3>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Up to 250,000 transactions/month.</p>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>$999 <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 400 }}>/ mo</span></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleUpgrade('growth')} disabled={processing || sub?.tier === "growth"}>
            {sub?.tier === "growth" ? "Current Plan" : "Upgrade to Growth"}
          </button>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Scale</h3>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Up to 1,000,000 transactions/month.</p>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>$3,499 <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 400 }}>/ mo</span></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleUpgrade('scale')} disabled={processing || sub?.tier === "scale"}>
            {sub?.tier === "scale" ? "Current Plan" : "Upgrade to Scale"}
          </button>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Enterprise</h3>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>1M+ transactions, dedicated support, custom SLA.</p>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>$7,500+ <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 400 }}>/ mo</span></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleUpgrade('enterprise')} disabled={processing || sub?.tier === "enterprise"}>
            {sub?.tier === "enterprise" ? "Current Plan" : "Contact Sales"}
          </button>
        </Card>

      </div>
    </PageShell>
  );
}
