"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthScreen } from "../auth-screen";
import { supabase } from "../../lib/supabase";
import { createPlanProject, deletePlanProject, listPlanProjects } from "../../lib/plan-electric/data";
import type { PlanProject } from "../../lib/plan-electric/types";

const ACTIVE_COMPANY_KEY = "frizeo-oferte:active-company:v1";

export function PlanProjectsApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<PlanProject[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const companyId = window.localStorage.getItem(ACTIVE_COMPANY_KEY) || "";
    listPlanProjects(companyId, user.id)
      .then(setProjects)
      .catch((error: Error) => setMessage(error.message));
  }, [user]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const companyId = window.localStorage.getItem(ACTIVE_COMPANY_KEY) || "";
      const created = await createPlanProject({
        ownerId: user.id,
        companyId,
        name: form.name.trim() || "Proiect electric",
        client: form.client.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      });
      window.location.href = `/plan-electric/${created.project.id}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Proiectul nu a putut fi creat.");
      setBusy(false);
    }
  }

  async function removeProject(id: string) {
    if (!window.confirm("Ștergi acest proiect?")) return;
    try {
      await deletePlanProject(id);
      setProjects((current) => current.filter((project) => project.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ștergerea a eșuat.");
    }
  }

  if (authLoading) {
    return <main className="pe-app"><div className="pe-loading"><p>Se verifică sesiunea…</p></div></main>;
  }
  if (!user) return <AuthScreen />;

  return (
    <main className="pe-app pe-projects-page">
      <header className="pe-projects-header">
        <div>
          <Link href="/" className="pe-back">← Frizeo Oferte</Link>
          <h1>Plan Electric</h1>
          <p>Propuneri profesionale pe plan arhitectural — simboluri, legendă, export PDF/PNG.</p>
        </div>
      </header>

      <section className="pe-projects-grid">
        <form className="pe-create-card" onSubmit={createProject}>
          <h2>Proiect nou</h2>
          <label>Nume proiect<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Instalație electrică locuință" required /></label>
          <label>Beneficiar<input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} placeholder="Nume client" /></label>
          <label>Adresă<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Localitate, stradă" /></label>
          <label>Observații<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} /></label>
          {message && <div className="pe-message">{message}</div>}
          <button className="pe-primary" disabled={busy}>{busy ? "Se creează…" : "Creează proiect"}</button>
        </form>

        <div className="pe-project-list">
          <h2>Proiectele tale</h2>
          {projects.length === 0 ? (
            <p className="pe-muted">Nu există încă proiecte. Creează primul plan electric.</p>
          ) : (
            projects.map((project) => (
              <article key={project.id} className="pe-project-row">
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.client || "Fără beneficiar"}{project.address ? ` · ${project.address}` : ""}</small>
                </div>
                <div className="pe-project-actions">
                  <Link href={`/plan-electric/${project.id}`}>Deschide editor</Link>
                  <button type="button" onClick={() => void removeProject(project.id)}>Șterge</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
