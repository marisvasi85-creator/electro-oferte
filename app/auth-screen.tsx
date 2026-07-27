"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { passwordStrength, passwordStrengthHint } from "../lib/ro-validation";

function authMessage(message: string) {
  if (message.includes("Invalid login credentials")) return "E-mailul sau parola nu sunt corecte.";
  if (message.includes("User already registered")) return "Există deja un cont cu această adresă.";
  if (message.includes("Password should be")) return "Parola trebuie să aibă cel puțin 8 caractere.";
  if (message.includes("For security purposes")) return "Așteaptă câteva secunde și încearcă din nou.";
  return message;
}

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "forgot") {
      const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/recovery`,
      });
      setBusy(false);
      if (result.error) {
        setMessage(authMessage(result.error.message));
        return;
      }
      setMessage("Ți-am trimis un e-mail cu linkul de recuperare a parolei.");
      return;
    }

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

  const strength = mode === "signup" && password ? passwordStrength(password) : null;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark auth-logo">F</div>
        <span className="eyebrow">FRIZEO OFERTE</span>
        <h1>
          {mode === "login" ? "Bine ai revenit" : mode === "signup" ? "Creează un cont" : "Recuperare parolă"}
        </h1>
        <p>
          {mode === "forgot"
            ? "Introdu e-mailul contului și îți trimitem un link de resetare."
            : "Oferte profesionale pentru orice tip de afacere, cu datele firmei tale."}
        </p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          {mode !== "forgot" && (
            <label>
              Parolă
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showPassword ? "Ascunde" : "Arată"}
                </button>
              </div>
            </label>
          )}
          {strength && (
            <div className={`password-strength strength-${strength === "slabă" ? "weak" : strength === "medie" ? "medium" : "strong"}`}>
              {passwordStrengthHint(password)}
            </div>
          )}
          {message && <div className="auth-message">{message}</div>}
          <button className="primary" disabled={busy}>
            {busy
              ? "Se procesează…"
              : mode === "login"
                ? "Intră în aplicație"
                : mode === "signup"
                  ? "Creează contul"
                  : "Trimite linkul de recuperare"}
          </button>
        </form>
        {mode === "login" && (
          <button className="auth-switch" onClick={() => { setMode("forgot"); setMessage(""); }}>
            Ai uitat parola?
          </button>
        )}
        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
          }}
        >
          {mode === "signup" ? "Ai deja cont? Autentifică-te" : "Nu ai cont? Creează unul gratuit"}
        </button>
        {mode === "forgot" && (
          <button className="auth-switch" onClick={() => { setMode("login"); setMessage(""); }}>
            Înapoi la autentificare
          </button>
        )}
        <nav className="auth-legal" aria-label="Documente legale">
          <Link href="/termeni">Termeni</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
        </nav>
      </section>
    </main>
  );
}
