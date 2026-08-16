import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ContractorPortal from "./pages/ContractorPortal.jsx";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!error) setProfile(data);
        setLoadingProfile(false);
      });
  }, [session]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session === undefined) {
    return <CenteredMessage text="Loading…" />;
  }

  if (!session) {
    return <Login />;
  }

  if (loadingProfile || !profile) {
    return <CenteredMessage text="Loading your account…" />;
  }

  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} onLogout={handleLogout} />;
  }

  return <ContractorPortal profile={profile} onLogout={handleLogout} />;
}

function CenteredMessage({ text }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "13px",
      }}
    >
      {text}
    </div>
  );
}
