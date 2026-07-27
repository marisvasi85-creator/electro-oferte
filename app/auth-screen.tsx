"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

function authMessage(message: string) {
  if (message.includes("Invalid login credentials")) return "E-mailul sau parola nu sunt corecte.";
  if (message.includes("User already registered")) return "Există deja un cont cu această adresă.";
  if (message.includes("Password should be")) return "Parola trebuie să aibă cel puțin 8 caractere.";
  return message;
}

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
    setBusy(false);
    if (result.error) {
      setMessage(authMessage(result.error.message));
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Cont creat. Confirmă adresa din e-mail, apoi autentifică-te.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark auth-logo">F</div>
        <span className="eyebrow">FRIZEO OFERTE</span>
        <h1>{mode === "login" ? "Bine ai revenit" : "Creează un cont"}</h1>
        <p>Oferte profesionale pentru orice tip de afacere, cu datele firmei tale.</p>
        <form onSubmit={submit}>
          <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Parolă<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {message && <div className="auth-message">{message}</div>}
          <button className="primary" disabled={busy}>{busy ? "Se procesează…" : mode === "login" ? "Intră în aplicație" : "Creează contul"}</button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "Nu ai cont? Creează unul gratuit" : "Ai deja cont? Autentifică-te"}
        </button>
      </section>
    </main>
  );
}
