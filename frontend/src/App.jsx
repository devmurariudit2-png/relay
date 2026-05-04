import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import * as API from "./api/index.js";
import Spinner from "./components/ui/Spinner.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AppShell from "./components/layout/AppShell.jsx";

export default function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      <Route path="/" element={!isAuth ? <Landing onEnter={() => navigate("/signin")} /> : <Navigate to="/app/dashboard" />} />
      <Route path="/signin" element={!isAuth ? <AuthPage onLogin={u => { setUser(u); navigate("/app/dashboard"); }} onBack={() => navigate("/")} /> : <Navigate to="/app/dashboard" />} />
      <Route path="/app/*" element={isAuth ? <AppShell user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/signin" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}