"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { passwordStrength, passwordStrengthHint } from "../../lib/ro-validation";

export default function RecoveryPage() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setAllowed(true);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setAllowed(true);
      setReady(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    if (password !== confirm) {
      setMessage("Parolele nu coincid.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setDone(true);
    setMessage("Parola a fost actualizată. Poți continua în aplicație.");
  }

  const strength = password ? passwordStrength(password) : null;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark auth-logo">F</div>
        <span className="eyebrow">FRIZEO OFERTE</span>
        <h1>Setează o parolă nouă</h1>
        <p>Alege o parolă puternică pentru contul tău.</p>

        {!ready ? (
          <p>Se verifică linkul de recuperare…</p>
        ) : !allowed ? (
          <>
            <div className="auth-message">
              Linkul de recuperare lipsește sau a expirat. Solicită unul nou din ecranul de autentificare.
            </div>
            <Link className="auth-switch" href="/">Înapoi la autentificare</Link>
          </>
        ) : done ? (
          <>
            <div className="auth-message">{message}</div>
            <Link className="primary auth-link-button" href="/">Intră în aplicație</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <label>
              Parolă nouă
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Ascunde" : "Arată"}
                </button>
              </div>
            </label>
            {strength && (
              <div className={`password-strength strength-${strength === "slabă" ? "weak" : strength === "medie" ? "medium" : "strong"}`}>
                {passwordStrengthHint(password)}
              </div>
            )}
            <label>
              Confirmă parola
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </label>
            {message && <div className="auth-message">{message}</div>}
            <button className="primary" disabled={busy}>
              {busy ? "Se salvează…" : "Salvează parola"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
