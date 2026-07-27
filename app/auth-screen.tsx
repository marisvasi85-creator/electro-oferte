"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

const BETA_EMAIL = "marisvasi85@gmail.com";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: BETA_EMAIL, password })
      : await supabase.auth.signUp({ email: BETA_EMAIL, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Cont creat. Verifică e-mailul și confirmă adresa, apoi autentifică-te.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark auth-logo">E</div>
        <span className="eyebrow">ELECTRICSMART</span>
        <h1>{mode === "login" ? "Autentificare beta" : "Creează contul beta"}</h1>
        <p>Ofertele, clienții și catalogul vor fi sincronizate în siguranță între dispozitive.</p>
        <form onSubmit={submit}>
          <label>E-mail<input type="email" value={BETA_EMAIL} readOnly /></label>
          <label>Parolă<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {message && <div className="auth-message">{message}</div>}
          <button className="primary" disabled={busy}>{busy ? "Se procesează…" : mode === "login" ? "Intră în aplicație" : "Creează contul"}</button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "Prima utilizare? Creează contul beta" : "Ai deja cont? Autentifică-te"}
        </button>
      </section>
    </main>
  );
}
