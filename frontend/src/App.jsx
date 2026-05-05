import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import * as API from "./api/index.js";
import Spinner from "./components/ui/Spinner.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import * as Sentry from "@sentry/react";

// Initialize Sentry for React Frontend Error Tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration ? Sentry.browserTracingIntegration() : new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
});

function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    }).catch((err) => {
      console.error("Failed to load Supabase session:", err);
      setIsInitializing(false); // Failsafe to ensure the app doesn't stay stuck on the spinner
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Don't treat this as a real login — keep user on reset page
        setIsPasswordRecovery(true);
        return;
      }
      setIsPasswordRecovery(false);
      setSession(session);
      if (!session) {
        setUser(null);
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: fetchedUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: API.getMe,
    retry: false,
    enabled: !!session,
  });

  useEffect(() => {
    if (fetchedUser) setUser(fetchedUser);
  }, [fetchedUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    queryClient.clear();
    navigate("/");
  };

  const isAuth = !!session;

  if (isInitializing || (isAuth && isUserLoading)) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}><Spinner size={32} /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={!isAuth ? <Landing onEnter={() => navigate("/signin")} /> : <Navigate to={isPasswordRecovery ? "/reset-password" : "/app/dashboard"} />} />
      <Route path="/signin" element={!isAuth ? <AuthPage onLogin={u => { setUser(u); navigate("/app/dashboard"); }} onBack={() => navigate("/")} /> : <Navigate to={isPasswordRecovery ? "/reset-password" : "/app/dashboard"} />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app/*" element={isAuth && !isPasswordRecovery ? <AppShell user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to={isPasswordRecovery ? "/reset-password" : "/signin"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const FallbackErrorUI = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-sans text-gray-900">
    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-6">
      <span className="text-white font-extrabold text-2xl">R</span>
    </div>
    <h2 className="text-2xl font-bold mb-2 tracking-tight">Something went wrong</h2>
    <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
      An unexpected error occurred in the application. Our engineering team has been automatically notified and is investigating the issue.
    </p>
    <button
      onClick={() => window.location.assign('/')}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 px-6 transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98]"
    >
      Refresh Application
    </button>
  </div>
);

export default Sentry.withErrorBoundary(App, {
  fallback: <FallbackErrorUI />
});