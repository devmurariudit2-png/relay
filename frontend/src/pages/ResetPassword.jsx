import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Spinner from "../components/ui/Spinner.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [ready, setReady]       = useState(false); // session from hash loaded
  const [done, setDone]         = useState(false);

  // Supabase embeds the recovery token in the URL hash.
  // onAuthStateChange fires PASSWORD_RECOVERY when it parses the token.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also handle if the session is already established (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm)  { setErr("Passwords do not match."); return; }
    setErr(""); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/signin"), 2500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      {/* Left branding pane */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black flex-col justify-between overflow-hidden p-12">
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ background: "radial-gradient(circle at 30% 30%, #EF4444 0%, transparent 50%), radial-gradient(circle at 70% 70%, #F87171 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 cursor-pointer inline-flex" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-extrabold text-xl">R</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Relay</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Set a new password.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Choose a strong password you haven't used before.
          </p>
        </div>
        <div className="relative z-10 text-gray-500 text-sm">
          © {new Date().getFullYear()} Relay Inc.
        </div>
      </div>

      {/* Right form pane */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Reset password</h1>
            <p className="text-gray-500 text-sm">Enter your new password below.</p>
          </div>

          {done ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Password updated! Redirecting to sign in…</span>
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-center gap-4 py-10 text-gray-400 text-sm">
              <Spinner size={28} />
              <span>Verifying reset link…</span>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 w-full">
              <div className="w-full space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">New password</label>
                <input
                  required
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder-gray-400"
                />
              </div>

              <div className="w-full space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700">Confirm password</label>
                <input
                  required
                  type="password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder-gray-400"
                />
              </div>

              {err && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600 w-full flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span>{err}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-3 px-4 text-[15px] mt-2 border-none cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] shadow-sm flex justify-center items-center h-[48px]"
              >
                {loading ? <Spinner size={20} color="#fff" /> : "Update Password"}
              </button>

              <div className="mt-4 text-center text-sm text-gray-500">
                <button type="button" onClick={() => navigate("/signin")} className="text-red-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
