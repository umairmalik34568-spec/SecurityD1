import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Account created. New accounts start as Contractor — ask your admin to grant access if needed.");
      }
    }
    setBusy(false);
  }

  return (
    <div
      className="grid-bg"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "32px" }}>
        <div
          style={{ color: "var(--cyan)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.15em" }}
          className="mb-2"
        >
          DISTRICT ONE · MBR CITY
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "24px", margin: "4px 0 24px" }}>
          Villa Permit Portal
        </h1>

        <div className="flex gap-2" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="btn-secondary"
            style={{
              flex: 1,
              borderColor: mode === "signin" ? "var(--cyan)" : "var(--panel-line)",
              color: mode === "signin" ? "var(--cyan)" : "var(--text-muted)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="btn-secondary"
            style={{
              flex: 1,
              borderColor: mode === "signup" ? "var(--cyan)" : "var(--panel-line)",
              color: mode === "signup" ? "var(--cyan)" : "var(--text-muted)",
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div style={{ color: "var(--red)", fontSize: "13px" }}>{error}</div>
          )}
          {info && (
            <div style={{ color: "var(--green)", fontSize: "13px" }}>{info}</div>
          )}

          <button type="submit" className="btn-primary" disabled={busy} style={{ marginTop: "8px" }}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "20px", lineHeight: 1.5 }}>
          Contractors: use the account your site admin created or invited for you. Admin access is
          granted manually — new sign-ups start as Contractor.
        </div>
      </div>
    </div>
  );
}
