import { useState, useEffect, useCallback } from "react";
import * as API from "./api/index.js";
import Spinner from "./components/ui/Spinner.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AppShell from "./components/layout/AppShell.jsx";

const PATH_FOR_SCREEN = { landing: "/", auth: "/signin", app: "/app" };

function screenFromPath(pathname, hasSession) {
  if (pathname === "/signin" || pathname === "/auth") return "auth";
  if (hasSession) return "app";
  return "landing";
}

function appTabFromPath(pathname) {
  const match = pathname.match(/^\/app\/([^/]+)/);
  return match ? match[1] : null;
}

export default function App() {
  const [screen, setScreen] = useState(() => {
    if (typeof window === "undefined") return "landing";
    return window.history.state?.screen || screenFromPath(window.location.pathname, false);
  });
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const navigate = useCallback(nextScreen => {
    if (typeof window !== "undefined") {
      const nextPath = PATH_FOR_SCREEN[nextScreen];
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ screen: nextScreen }, "", nextPath);
      } else if (window.history.state?.screen !== nextScreen) {
        window.history.replaceState({ screen: nextScreen }, "", nextPath);
      }
    }
    setScreen(nextScreen);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("rec_token");
    if (token) {
      API.getMe()
        .then(u => { setUser(u); navigate("app"); })
        .catch(() => localStorage.removeItem("rec_token"))
        .finally(() => setBootstrapped(true));
    } else {
      setBootstrapped(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (!bootstrapped || screen !== "app" || typeof window === "undefined") return;
    if (window.history.state?.screen !== "app") {
      const tab = appTabFromPath(window.location.pathname) || localStorage.getItem("rec_tab") || "dashboard";
      window.history.replaceState({ screen: "app", tab }, "", window.location.pathname);
    }
  }, [bootstrapped, screen]);

  useEffect(() => {
    const handlePop = event => {
      if (event.state?.screen) {
        setScreen(event.state.screen);
      } else {
        setScreen(screenFromPath(window.location.pathname, !!user));
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [user]);

  if (!bootstrapped) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}><Spinner size={32} /></div>;
  if (screen === "landing") return <Landing onEnter={() => navigate("auth")} />;
  if (screen === "auth") return <AuthPage onLogin={u => { setUser(u); navigate("app"); }} onBack={() => navigate("landing")} />;
  return <AppShell user={user} setUser={setUser} onLogout={() => { localStorage.removeItem("rec_token"); setUser(null); navigate("landing"); }} />;
}