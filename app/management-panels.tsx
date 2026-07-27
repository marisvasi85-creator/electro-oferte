"use client";

export type ClientRecord = {
  id: string;
  type: "firmă" | "persoană fizică";
  name: string;
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
};

export type CompanySettings = {
  name: string;
  taxId: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  iban: string;
  bank: string;
  defaultWarranty: number;
  defaultValidity: number;
};

type ClientsViewProps = {
  clients: ClientRecord[];
  onChange: (clients: ClientRecord[]) => void;
  onCreateOffer: (clientName: string) => void;
  onDelete?: (id: string) => Promise<void>;
};

export function ClientsView({ clients, onChange, onCreateOffer, onDelete }: ClientsViewProps) {
  function addClient() {
    onChange([
      {
        id: crypto.randomUUID(),
        type: "firmă",
        name: "Client nou",
        taxId: "",
        address: "",
        contactPerson: "",
        phone: "",
        email: "",
      },
      ...clients,
    ]);
  }

  function updateClient(id: string, field: keyof ClientRecord, value: string) {
    onChange(clients.map((client) => client.id === id ? { ...client, [field]: value } : client));
  }

  async function removeClient(id: string) {
    if (!window.confirm("Ștergi definitiv acest client?")) return;
    await onDelete?.(id);
    onChange(clients.filter((client) => client.id !== id));
  }

  return (
    <>
      <header className="topbar">
        <div><span className="eyebrow">RELAȚII COMERCIALE</span><h1>Clienți</h1><p>{clients.length} clienți sincronizați</p></div>
        <button className="primary" onClick={addClient}>＋ Client nou</button>
      </header>
      <section className="management-page">
        <div className="local-notice"><strong>Sincronizare Supabase activă</strong><span>Modificările sunt salvate automat în proiectul Oferte.</span></div>
        <div className="management-grid">
          {clients.map((client) => (
            <article className="client-card card" key={client.id}>
              <div className="client-card-head">
                <span className="client-initial">{client.name.slice(0, 2).toUpperCase()}</span>
                <label>Tip client<select value={client.type} onChange={(event) => updateClient(client.id, "type", event.target.value)}><option>firmă</option><option>persoană fizică</option></select></label>
                <button className="remove-card" onClick={() => removeClient(client.id)} aria-label="Șterge clientul">×</button>
              </div>
              <label>Denumire / nume<input value={client.name} onChange={(event) => updateClient(client.id, "name", event.target.value)} /></label>
              <div className="client-fields">
                <label>CUI / CNP<input value={client.taxId} onChange={(event) => updateClient(client.id, "taxId", event.target.value)} /></label>
                <label>Persoană contact<input value={client.contactPerson} onChange={(event) => updateClient(client.id, "contactPerson", event.target.value)} /></label>
                <label>Telefon<input value={client.phone} onChange={(event) => updateClient(client.id, "phone", event.target.value)} /></label>
                <label>E-mail<input type="email" value={client.email} onChange={(event) => updateClient(client.id, "email", event.target.value)} /></label>
              </div>
              <label>Adresă<input value={client.address} onChange={(event) => updateClient(client.id, "address", event.target.value)} /></label>
              <button className="client-offer-button" onClick={() => onCreateOffer(client.name)}>Creează ofertă pentru client →</button>
            </article>
          ))}
          {clients.length === 0 && <div className="empty-state"><span>♙</span><h2>Nu există clienți</h2><p>Adaugă primul client pentru a-l selecta rapid în ofertă.</p><button className="primary" onClick={addClient}>Adaugă client</button></div>}
        </div>
      </section>
    </>
  );
}

type SettingsViewProps = {
  settings: CompanySettings;
  onChange: (settings: CompanySettings) => void;
};

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  function update(field: keyof CompanySettings, value: string) {
    onChange({
      ...settings,
      [field]: field === "defaultWarranty" || field === "defaultValidity" ? Number(value) : value,
    });
  }

  return (
    <>
      <header className="topbar">
        <div><span className="eyebrow">CONFIGURARE</span><h1>Setările firmei</h1><p>Date utilizate automat în ofertele și PDF-urile noi</p></div>
        <span className="saved-badge">Sincronizat automat</span>
      </header>
      <section className="management-page settings-layout">
        <section className="card settings-card">
          <div className="section-heading"><span className="step">1</span><div><h2>Identitate fiscală</h2><p>Date publice precompletate din frizeo.ro</p></div></div>
          <div className="settings-form">
            <label className="wide">Denumirea firmei<input value={settings.name} onChange={(event) => update("name", event.target.value)} /></label>
            <label>CUI<input value={settings.taxId} onChange={(event) => update("taxId", event.target.value)} /></label>
            <label>Registrul Comerțului<input value={settings.registrationNumber} onChange={(event) => update("registrationNumber", event.target.value)} /></label>
            <label className="wide">Sediu<input value={settings.address} onChange={(event) => update("address", event.target.value)} /></label>
          </div>
        </section>
        <section className="card settings-card">
          <div className="section-heading"><span className="step">2</span><div><h2>Contact și plată</h2><p>Câmpurile bancare pot rămâne necompletate</p></div></div>
          <div className="settings-form">
            <label>Telefon<input value={settings.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label>E-mail<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label>IBAN<input value={settings.iban} onChange={(event) => update("iban", event.target.value)} placeholder="RO…" /></label>
            <label>Bancă<input value={settings.bank} onChange={(event) => update("bank", event.target.value)} /></label>
          </div>
        </section>
        <section className="card settings-card">
          <div className="section-heading"><span className="step">3</span><div><h2>Valori implicite</h2><p>Se aplică ofertelor noi și pot fi modificate ulterior</p></div></div>
          <div className="settings-form">
            <label>Garanție implicită<input type="number" min="0" value={settings.defaultWarranty} onChange={(event) => update("defaultWarranty", event.target.value)} /><span className="field-suffix">luni</span></label>
            <label>Valabilitate implicită<input type="number" min="1" value={settings.defaultValidity} onChange={(event) => update("defaultValidity", event.target.value)} /><span className="field-suffix">zile</span></label>
          </div>
        </section>
        <aside className="settings-preview card">
          <span className="eyebrow">ANTET DOCUMENT</span>
          <strong>{settings.name || "Denumirea firmei"}</strong>
          <p>CUI {settings.taxId || "—"} · {settings.registrationNumber || "—"}</p>
          <p>{settings.address || "Adresa firmei"}</p>
          <p>{settings.phone || "Telefon"} {settings.email ? `· ${settings.email}` : ""}</p>
          {settings.iban && <p>IBAN {settings.iban}{settings.bank ? ` · ${settings.bank}` : ""}</p>}
        </aside>
      </section>
    </>
  );
}
