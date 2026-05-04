import { useState } from "react";
import { supabase } from "../supabase";
import Spinner from "../components/ui/Spinner.jsx";

// mode: "login" | "register" | "forgot"
export default function AuthPage({ onLogin, onBack }) {
  const [mode, setMode]     = useState("login");
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (m) => { setMode(m); setErr(""); setForgotSent(false); };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErr("");

    // --- Forgot password ---
    if (mode === "forgot") {
      if (!form.email.trim()) { setErr("Please enter your email address."); return; }
      setLoading(true);
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo });
        if (error) throw error;
        setForgotSent(true);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- Login / Register ---
    if (!form.email.trim() || !form.password.trim() || (mode === "register" && !form.name.trim())) {
      setErr("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        // App.jsx's onAuthStateChange handles the session — just forward the user object.
        onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.name.trim() } },
        });
        if (error) throw error;
        // Show confirmation message if email confirmation is required
        if (data.user && !data.session) {
          setErr(""); // clear
          // Supabase email confirmation pending — inform user
          setMode("__confirm__");
          return;
        }
        onLogin(data.user);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Titles / subtitles per mode ----
  const titles = {
    login:       { h: "Welcome back",      sub: "Enter your details below to sign in." },
    register:    { h: "Create an account", sub: "Sign up below to get started." },
    forgot:      { h: "Forgot password?",  sub: "We'll send a reset link to your email." },
    __confirm__: { h: "Check your email",  sub: "A confirmation link has been sent to your inbox." },
  };
  const { h, sub } = titles[mode] || titles.login;

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      {/* Left Branding Pane */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black flex-col justify-between overflow-hidden p-12">
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ background: "radial-gradient(circle at 30% 30%, #EF4444 0%, transparent 50%), radial-gradient(circle at 70% 70%, #F87171 0%, transparent 50%)" }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 cursor-pointer inline-flex" onClick={onBack}>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-extrabold text-xl">R</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Relay</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            The platform for fast, accurate reconciliation.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Match thousands of transactions in seconds, track exceptions effortlessly, and give your finance team a single source of truth.
          </p>
        </div>

        <div className="relative z-10 text-gray-500 text-sm">
          © {new Date().getFullYear()} Relay Inc.
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center relative items-center p-6 sm:p-12">
        {/* Mobile Nav */}
        <div className="lg:hidden absolute top-6 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Relay</span>
          </div>
        </div>

        <div className="w-full max-w-[380px] pt-12 lg:pt-0">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">{h}</h1>
            <p className="text-gray-500 text-sm">{sub}</p>
          </div>

          {/* Email confirmation pending */}
          {mode === "__confirm__" && (
            <div className="flex flex-col gap-5">
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Account created! Check your email to confirm, then sign in.</span>
              </div>
              <button type="button" onClick={() => switchMode("login")} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-3 px-4 text-[15px] border-none cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] shadow-sm flex justify-center items-center h-[48px]">
                Back to Sign In
              </button>
            </div>
          )}

          {/* Forgot password — sent state */}
          {mode === "forgot" && forgotSent && (
            <div className="flex flex-col gap-5">
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Reset link sent! Check your inbox and click the link to set a new password.</span>
              </div>
              <button type="button" onClick={() => switchMode("login")} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-3 px-4 text-[15px] border-none cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] shadow-sm flex justify-center items-center h-[48px]">
                Back to Sign In
              </button>
            </div>
          )}

          {/* Main form */}
          {mode !== "__confirm__" && !(mode === "forgot" && forgotSent) && (
            <form onSubmit={submit} className="flex flex-col gap-5 w-full">

              {mode === "register" && (
                <div className="w-full space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Full Name</label>
                  <input required className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder-gray-400" placeholder="Sarah Kim" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              )}

              <div className="w-full space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">Email address</label>
                <input required className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder-gray-400" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              {mode !== "forgot" && (
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[13px] font-semibold text-gray-700">Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => switchMode("forgot")} className="text-sm font-medium text-red-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input required className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder-gray-400" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              )}

              {err && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600 w-full flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span>{err}</span>
                </div>
              )}

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-3 px-4 text-[15px] mt-2 border-none cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] shadow-sm flex justify-center items-center h-[48px]" disabled={loading}>
                {loading ? <Spinner size={20} color="#fff" /> : (
                  mode === "login" ? "Sign In" :
                  mode === "register" ? "Create Account" :
                  "Send Reset Link"
                )}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                {mode === "login" ? (
                  <>Don't have an account? <button type="button" onClick={() => switchMode("register")} className="text-red-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Sign up</button></>
                ) : mode === "register" ? (
                  <>Already have an account? <button type="button" onClick={() => switchMode("login")} className="text-red-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Log in</button></>
                ) : (
                  <>Remember it? <button type="button" onClick={() => switchMode("login")} className="text-red-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Back to sign in</button></>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
