"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createCompanyForUser } from "../lib/oferte-data";
import { cuiHint, phoneHint } from "../lib/ro-validation";

export function CompanyOnboarding({ user, onComplete }: { user: User; onComplete: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("windows_doors");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const taxError = cuiHint(taxId);
  const phoneError = phoneHint(phone);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (taxError || phoneError) {
      setMessage(taxError || phoneError);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createCompanyForUser(user.id, user.email ?? "", { name: name.trim(), industry, taxId: taxId.trim(), phone: phone.trim() });
      onComplete();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Firma nu a putut fi creată.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page onboarding-page">
      <section className="auth-card onboarding-card">
        <div className="brand-mark auth-logo">F</div>
        <span className="eyebrow">CONFIGURARE INIȚIALĂ</span>
        <h1>Creează spațiul firmei tale</h1>
        <p>Datele, clienții și ofertele acestei firme vor fi separate de celelalte afaceri. Poți adăuga firme noi ulterior.</p>
        <form onSubmit={submit}>
          <label>Denumirea firmei<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Ferestre Confort SRL" required /></label>
          <label>Domeniu de activitate
            <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="windows_doors">Uși și ferestre PVC / aluminiu</option>
              <option value="electrical">Instalații electrice</option>
              <option value="construction">Construcții și amenajări</option>
              <option value="hvac">Instalații termice / HVAC</option>
              <option value="plumbing">Instalații sanitare</option>
              <option value="other">Alt domeniu</option>
            </select>
          </label>
          <div className="onboarding-grid">
            <label>
              CUI (opțional)
              <input value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="RO…" />
              {taxError && <span className="field-hint error">{taxError}</span>}
            </label>
            <label>
              Telefon (opțional)
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07xx xxx xxx" />
              {phoneError && <span className="field-hint error">{phoneError}</span>}
            </label>
          </div>
          {message && <div className="auth-message">{message}</div>}
          <button className="primary" disabled={busy || Boolean(taxError) || Boolean(phoneError)}>
            {busy ? "Se configurează…" : "Creează firma și continuă"}
          </button>
        </form>
      </section>
    </main>
  );
}
