import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as API from "./api/index.js";
import Spinner from "./components/ui/Spinner.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AppShell from "./components/layout/AppShell.jsx";

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const { data: fetchedUser, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: API.getMe,
    retry: false,
    enabled: !!localStorage.getItem("rec_token")
  });

  useEffect(() => {
    if (fetchedUser) setUser(fetchedUser);
  }, [fetchedUser]);

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("rec_token");
      setUser(null);
      navigate("/");
    }
  }, [isError, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("rec_token");
    setUser(null);
    navigate("/");
  };

  const isAuth = !!user || !!localStorage.getItem("rec_token");

  if (isLoading) {
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