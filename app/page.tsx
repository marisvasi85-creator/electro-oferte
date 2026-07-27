"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import {
  ClientsView,
  SettingsView,
  type ClientRecord,
  type CompanySettings,
} from "./management-panels";
import { AuthScreen } from "./auth-screen";
import { supabase } from "../lib/supabase";
import {
  addRemoteCatalogItems,
  deleteRemoteClient,
  deleteRemoteOffer,
  loadBetaData,
  saveRemoteOffer,
  syncClients,
  syncCompany,
} from "../lib/oferte-data";

type OfferItem = {
  id: number;
  catalogId?: string;
  kind: "material" | "labor" | "expense";
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

type CatalogItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  kind: "material" | "labor" | "expense";
  unit: string;
  unitPrice: number;
  currency: string;
  vatRate: number;
  specifications: string;
  sourceType: string;
};

type SavedOffer = {
  id: string;
  number: string;
  client: string;
  clientDetails?: OfferClientDetails;
  title: string;
  issueDate: string;
  validityDays: string;
  currency: string;
  items: OfferItem[];
  labor: number;
  discount: number;
  notes: string;
  pdfColumns?: PdfColumns;
  status: "ciornă" | "trimisă" | "acceptată" | "respinsă";
  updatedAt: string;
};

type OfferClientDetails = {
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
};

const emptyClientDetails: OfferClientDetails = { taxId: "", address: "", contactPerson: "", phone: "", email: "" };

type PdfColumns = {
  unit: boolean;
  quantity: boolean;
  unitPrice: boolean;
  total: boolean;
  showDiscount: boolean;
};

const defaultPdfColumns: PdfColumns = { unit: true, quantity: true, unitPrice: true, total: true, showDiscount: true };

const DRAFT_KEY = "electro-oferte:draft:v1";

const initialClients: ClientRecord[] = [
  { id: "client-modern", type: "firmă", name: "Modern Construct Service", taxId: "", address: "Piatra Neamț", contactPerson: "", phone: "", email: "" },
  { id: "client-drmax", type: "firmă", name: "Dr. Max Mediaș", taxId: "", address: "Mediaș", contactPerson: "", phone: "", email: "" },
  { id: "client-apel", type: "firmă", name: "Apel Industries", taxId: "", address: "", contactPerson: "", phone: "", email: "" },
  { id: "client-buzatu", type: "firmă", name: "Centru Medical Buzatu", taxId: "", address: "", contactPerson: "", phone: "", email: "" },
];

const initialCompanySettings: CompanySettings = {
  name: "ElectricSmart.Co S.R.L.",
  taxId: "47684690",
  registrationNumber: "J02/287/2023",
  address: "România, Arad, Socodor, nr. 77",
  phone: "0751 970 357",
  email: "teomaris27@gmail.com",
  iban: "",
  bank: "",
  defaultWarranty: 24,
  defaultValidity: 30,
};

const initialItems: OfferItem[] = [
  { id: 1, kind: "material", name: "Cablu N2XH 3x2,5", unit: "m", quantity: 150, unitPrice: 6.75, vatRate: 21 },
  { id: 2, kind: "material", name: "Tablou Hager Volta 36M", unit: "buc", quantity: 1, unitPrice: 381, vatRate: 21 },
  { id: 3, kind: "material", name: "Material mărunt", unit: "buc", quantity: 1, unitPrice: 500, vatRate: 21 },
];

const money = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextOfferNumber(offers: SavedOffer[]) {
  const year = new Date().getFullYear();
  const max = offers.reduce((value, offer) => {
    const match = offer.number.match(/OF-\d{4}-(\d+)/);
    return Math.max(value, match ? Number(match[1]) : 0);
  }, 12);
  return `OF-${year}-${String(max + 1).padStart(3, "0")}`;
}

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("ro").replace(/[^a-z0-9]+/g, " ").trim();
}

function calculateOfferTotals(items: OfferItem[], discount: number, labor: number) {
  const materialsSubtotal = items
    .filter((item) => (item.kind ?? "material") !== "labor")
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const servicesSubtotal = items
    .filter((item) => item.kind === "labor")
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = materialsSubtotal * (discount / 100);
  const materialVat = items
    .filter((item) => (item.kind ?? "material") !== "labor")
    .reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100), 0) * (1 - discount / 100);
  const serviceVat = items
    .filter((item) => item.kind === "labor")
    .reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100), 0);
  const vat = materialVat + serviceVat;
  return {
    subtotal: materialsSubtotal,
    servicesSubtotal,
    discountAmount,
    vat,
    materials: materialsSubtotal - discountAmount + materialVat,
    services: servicesSubtotal + serviceVat,
    grand: materialsSubtotal - discountAmount + servicesSubtotal + vat + labor,
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<"editor" | "offers" | "clients" | "settings">("editor");
  const [items, setItems] = useState(initialItems);
  const [client, setClient] = useState("Modern Construct Service");
  const [clientDetails, setClientDetails] = useState<OfferClientDetails>(emptyClientDetails);
  const [title, setTitle] = useState("Instalație electrică locuință");
  const [issueDate, setIssueDate] = useState(today());
  const [validityDays, setValidityDays] = useState("30");
  const [currency, setCurrency] = useState("RON");
  const [labor, setLabor] = useState(4200);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("Garanție: 24 luni\nValabilitate: 30 zile de la data întocmirii\nOferta nu include costurile de deplasare și cazare.");
  const [pdfColumns, setPdfColumns] = useState<PdfColumns>(defaultPdfColumns);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);
  const [currentOfferId, setCurrentOfferId] = useState<string | null>(null);
  const [currentNumber, setCurrentNumber] = useState("OF-2026-013");
  const [saveMessage, setSaveMessage] = useState("Ciornă locală");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [baseCatalog, setBaseCatalog] = useState<CatalogItem[]>([]);
  const [customCatalog, setCustomCatalog] = useState<CatalogItem[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Toate");
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setHydrated(false);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadBetaData(user.id, user.email ?? "marisvasi85@gmail.com")
      .then((data) => {
        if (cancelled) return;
        setSavedOffers(data.offers);
        setClients(data.clients);
        setCompanySettings(data.company);
        setBaseCatalog(data.catalog);
        setCustomCatalog([]);
        setCurrentNumber(nextOfferNumber(data.offers));
        setSaveMessage("Sincronizat cu Supabase");
        setHydrated(true);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setSaveMessage(`Eroare Supabase: ${error.message}`);
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    const timer = window.setTimeout(() => {
      syncClients(user.id, clients).catch((error: Error) => setSaveMessage(`Eroare clienți: ${error.message}`));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [hydrated, user, clients]);

  useEffect(() => {
    if (!hydrated || !user) return;
    const timer = window.setTimeout(() => {
      syncCompany(user.id, companySettings).catch((error: Error) => setSaveMessage(`Eroare setări: ${error.message}`));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [hydrated, user, companySettings]);

  useEffect(() => {
    if (!hydrated) return;
    const draft: Partial<SavedOffer> = {
      id: currentOfferId ?? undefined,
      number: currentNumber,
      client, clientDetails, title, issueDate, validityDays, currency, items, labor, discount, notes, pdfColumns,
      status: "ciornă",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [hydrated, currentOfferId, currentNumber, client, clientDetails, title, issueDate, validityDays, currency, items, labor, discount, notes, pdfColumns]);

  const catalog = useMemo(() => [...customCatalog, ...baseCatalog], [customCatalog, baseCatalog]);
  const totals = useMemo(() => calculateOfferTotals(items, discount, labor), [items, discount, labor]);

  const categories = useMemo(
    () => ["Toate", ...Array.from(new Set(catalog.map((item) => item.category))).sort()],
    [catalog],
  );

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLocaleLowerCase("ro");
    return catalog
      .filter((item) => catalogCategory === "Toate" || item.category === catalogCategory)
      .filter((item) => !query || `${item.code} ${item.name} ${item.category} ${item.specifications}`.toLocaleLowerCase("ro").includes(query))
      .slice(0, 80);
  }, [catalog, catalogCategory, catalogQuery]);

  function updateItem(id: number, field: keyof OfferItem, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "name" || field === "unit" || field === "kind" ? value : Number(value) }
          : item,
      ),
    );
  }

  function addBlankItem() {
    const id = Math.max(0, ...items.map((item) => item.id)) + 1;
    setItems([...items, { id, kind: "material", name: "Articol nou", unit: "buc", quantity: 1, unitPrice: 0, vatRate: 21 }]);
  }

  function addCatalogItem(item: CatalogItem) {
    const id = Math.max(0, ...items.map((entry) => entry.id)) + 1;
    setItems([...items, {
      id,
      catalogId: item.id,
      kind: item.kind,
      name: item.name,
      unit: item.unit,
      quantity: 1,
      unitPrice: item.unitPrice || 0,
      vatRate: item.vatRate,
    }]);
    setCatalogOpen(false);
    setCatalogQuery("");
  }

  function removeItem(id: number) {
    setItems(items.filter((item) => item.id !== id));
  }

  function changeClient(value: string) {
    setClient(value);
    const match = clients.find((entry) => normalizeName(entry.name) === normalizeName(value));
    setClientDetails(match ? {
      taxId: match.taxId,
      address: match.address,
      contactPerson: match.contactPerson,
      phone: match.phone,
      email: match.email,
    } : emptyClientDetails);
  }

  function updateClientDetail(field: keyof OfferClientDetails, value: string) {
    setClientDetails((current) => ({ ...current, [field]: value }));
  }

  async function saveOffer() {
    if (!user || !hydrated) {
      setSaveMessage("Așteaptă finalizarea sincronizării");
      return;
    }
    setSaveMessage("Se salvează în Supabase…");
    const id = currentOfferId ?? crypto.randomUUID();
    const number = currentOfferId ? currentNumber : nextOfferNumber(savedOffers);
    const offer: SavedOffer = {
      id, number, client, clientDetails, title, issueDate, validityDays, currency, items, labor, discount, notes, pdfColumns,
      status: "ciornă",
      updatedAt: new Date().toISOString(),
    };
    const next = savedOffers.some((entry) => entry.id === id)
      ? savedOffers.map((entry) => entry.id === id ? offer : entry)
      : [offer, ...savedOffers];
    try {
      let clientAdded = false;
      const clientName = client.trim();
      let matchingClient = clients.find((entry) => normalizeName(entry.name) === normalizeName(clientName));
      if (clientName && !matchingClient) {
        matchingClient = { id: crypto.randomUUID(), type: "firmă", name: clientName, ...clientDetails };
        const nextClients = [matchingClient, ...clients];
        setClients(nextClients);
        await syncClients(user.id, nextClients);
        clientAdded = true;
      }

      const knownItems = new Set(catalog.map((entry) => `${entry.kind}:${normalizeName(entry.name)}:${entry.unit}`));
      const newCatalogItems: CatalogItem[] = [];
      items.forEach((item) => {
        const itemName = item.name.trim();
        const kind = item.kind ?? "material";
        const identity = `${kind}:${normalizeName(itemName)}:${item.unit}`;
        if (!itemName || knownItems.has(identity)) return;
        knownItems.add(identity);
        newCatalogItems.push({
          id: crypto.randomUUID(),
          code: "",
          name: itemName,
          category: kind === "labor" ? "Servicii și manoperă" : kind === "expense" ? "Costuri auxiliare" : "Materiale personalizate",
          subcategory: "Adăugat din ofertă",
          kind,
          unit: item.unit,
          unitPrice: item.unitPrice,
          currency,
          vatRate: item.vatRate,
          specifications: "",
          sourceType: "adăugat manual",
        });
      });
      if (newCatalogItems.length) {
        const insertedCatalog = await addRemoteCatalogItems(user.id, newCatalogItems);
        setCustomCatalog((current) => [...insertedCatalog, ...current]);
      }

      await saveRemoteOffer(user.id, offer, matchingClient?.id ?? null);
      setSavedOffers(next);
      setCurrentOfferId(id);
      setCurrentNumber(number);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(offer));
      const additions = [clientAdded ? "client nou" : "", newCatalogItems.length ? `${newCatalogItems.length} articole în catalog` : ""].filter(Boolean);
      setSaveMessage(`Salvat în Supabase la ${new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}${additions.length ? ` · adăugat: ${additions.join(", ")}` : ""}`);
    } catch (error) {
      setSaveMessage(`Salvarea a eșuat: ${(error as Error).message}`);
    }
  }

  function newOffer() {
    setCurrentOfferId(null);
    setCurrentNumber(nextOfferNumber(savedOffers));
    setClient("");
    setClientDetails(emptyClientDetails);
    setTitle("");
    setIssueDate(today());
    setValidityDays(String(companySettings.defaultValidity));
    setCurrency("RON");
    setItems([]);
    setLabor(0);
    setDiscount(0);
    setPdfColumns(defaultPdfColumns);
    setNotes(`Garanție: ${companySettings.defaultWarranty} luni\nValabilitate: ${companySettings.defaultValidity} zile de la data întocmirii`);
    localStorage.removeItem(DRAFT_KEY);
    setView("editor");
  }

  function newOfferForClient(clientName: string) {
    newOffer();
    changeClient(clientName);
    setValidityDays(String(companySettings.defaultValidity));
    setNotes(`Garanție: ${companySettings.defaultWarranty} luni\nValabilitate: ${companySettings.defaultValidity} zile de la data întocmirii`);
  }

  function openOffer(offer: SavedOffer) {
    setCurrentOfferId(offer.id);
    setCurrentNumber(offer.number);
    setClient(offer.client);
    setClientDetails(offer.clientDetails ?? emptyClientDetails);
    setTitle(offer.title);
    setIssueDate(offer.issueDate);
    setValidityDays(offer.validityDays);
    setCurrency(offer.currency);
    setItems(offer.items);
    setLabor(offer.labor);
    setDiscount(offer.discount);
    setNotes(offer.notes);
    setPdfColumns(offer.pdfColumns ?? defaultPdfColumns);
    setView("editor");
  }

  function duplicateOffer(offer: SavedOffer) {
    openOffer({ ...offer, id: "", number: nextOfferNumber(savedOffers), status: "ciornă" });
    setCurrentOfferId(null);
  }

  async function deleteOffer(id: string) {
    if (!window.confirm("Ștergi definitiv această ofertă?")) return;
    try {
      await deleteRemoteOffer(id);
      setSavedOffers(savedOffers.filter((offer) => offer.id !== id));
      setSaveMessage("Oferta a fost ștearsă din Supabase");
    } catch (error) {
      setSaveMessage(`Ștergerea a eșuat: ${(error as Error).message}`);
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      await deleteRemoteClient(id);
      setSaveMessage("Clientul a fost șters din Supabase");
    } catch (error) {
      setSaveMessage(`Ștergerea clientului a eșuat: ${(error as Error).message}`);
      throw error;
    }
  }

  async function downloadPdf() {
    setPdfBusy(true);
    setSaveMessage("Se generează PDF-ul…");
    try {
      const { generateOfferPdf } = await import("../lib/generate-offer-pdf");
      await generateOfferPdf({
        number: currentNumber,
        client,
        clientDetails,
        title,
        issueDate,
        validityDays,
        currency,
        items,
        labor,
        discount,
        notes,
        company: companySettings,
        totals,
        columns: pdfColumns,
      });
      setSaveMessage("PDF descărcat");
    } catch (error) {
      setSaveMessage(`PDF-ul nu a putut fi generat: ${(error as Error).message}`);
    } finally {
      setPdfBusy(false);
    }
  }

  if (authLoading) {
    return <main className="auth-page"><section className="auth-card"><h1>Se verifică sesiunea…</h1></section></main>;
  }
  if (!user) return <AuthScreen />;
  if (!hydrated) {
    return <main className="auth-page"><section className="auth-card"><h1>Pregătim versiunea beta…</h1><p>{saveMessage}</p></section></main>;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div><strong>Electro Oferte</strong><span>ElectricSmart</span></div>
        </div>
        <nav aria-label="Navigare principală">
          <button><Icon>⌂</Icon>Panou principal</button>
          <button className={view === "offers" ? "active" : ""} onClick={() => setView("offers")}><Icon>▤</Icon>Oferte <span className="count">{savedOffers.length}</span></button>
          <button className={view === "clients" ? "active" : ""} onClick={() => setView("clients")}><Icon>♙</Icon>Clienți <span className="count">{clients.length}</span></button>
          <button onClick={() => setCatalogOpen(true)}><Icon>◇</Icon>Catalog <span className="count">{catalog.length}</span></button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}><Icon>⚙</Icon>Setări firmă</button>
        </nav>
        <div className="company-card">
          <span className="company-avatar">ES</span>
          <div><strong>ElectricSmart.Co</strong><small>CUI 47684690</small></div>
          <button className="logout-button" onClick={() => supabase.auth.signOut()} title="Ieșire">↪</button>
        </div>
      </aside>

      <section className="workspace">
        {view === "clients" ? (
          <ClientsView clients={clients} onChange={setClients} onCreateOffer={newOfferForClient} onDelete={handleDeleteClient} />
        ) : view === "settings" ? (
          <SettingsView settings={companySettings} onChange={setCompanySettings} />
        ) : view === "offers" ? (
          <>
            <header className="topbar">
              <div><span className="eyebrow">ELECTRICSMART</span><h1>Oferte</h1><p>{savedOffers.length} salvate pe acest dispozitiv</p></div>
              <button className="primary" onClick={newOffer}>＋ Ofertă nouă</button>
            </header>
            <section className="offers-page">
              <div className="local-notice"><strong>Versiune beta sincronizată</strong><span>Ofertele sunt salvate în proiectul Supabase Oferte și sunt disponibile după autentificare.</span></div>
              {savedOffers.length === 0 ? (
                <div className="empty-state"><span>▤</span><h2>Nu există oferte salvate</h2><p>Creează prima ofertă și verifică fluxul complet înainte de conectarea bazei de date.</p><button className="primary" onClick={newOffer}>Creează oferta</button></div>
              ) : (
                <div className="offers-table card">
                  <div className="offers-table-head"><span>Număr</span><span>Beneficiar și lucrare</span><span>Actualizată</span><span>Status</span><span></span></div>
                  {savedOffers.map((offer) => {
                    const offerTotal = calculateOfferTotals(offer.items, offer.discount, offer.labor).grand;
                    return (
                      <div className="offer-row" key={offer.id}>
                        <button className="offer-number" onClick={() => openOffer(offer)}>{offer.number}</button>
                        <button className="offer-main" onClick={() => openOffer(offer)}><strong>{offer.client || "Beneficiar necompletat"}</strong><span>{offer.title || "Lucrare fără titlu"} · {money.format(offerTotal)} {offer.currency === "RON" ? "lei" : "EUR"}</span></button>
                        <span className="offer-date">{new Date(offer.updatedAt).toLocaleDateString("ro-RO")}</span>
                        <span className={`status ${offer.status}`}>{offer.status}</span>
                        <div className="row-actions"><button onClick={() => duplicateOffer(offer)} title="Duplică">⧉</button><button onClick={() => deleteOffer(offer.id)} title="Șterge">×</button></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <header className="topbar">
              <div>
                <button className="back" onClick={() => setView("offers")}>← Înapoi la oferte</button>
                <h1>{currentOfferId ? "Editează oferta" : "Ofertă nouă"}</h1>
                <p>{saveMessage} · {currentNumber}</p>
              </div>
              <div className="top-actions">
                <button className="secondary" onClick={downloadPdf} disabled={pdfBusy}>
                  {pdfBusy ? "Se generează PDF…" : "Descarcă PDF"}
                </button>
                <button className="primary" onClick={saveOffer}>Salvează oferta</button>
              </div>
            </header>

            <div className="content-grid">
              <div className="editor">
                <section className="card details-card">
                  <div className="section-heading"><span className="step">1</span><div><h2>Detalii ofertă</h2><p>Informațiile de bază ale lucrării</p></div></div>
                  <div className="form-grid">
                    <label>Beneficiar
                      <input list="client-options" value={client} onChange={(event) => changeClient(event.target.value)} />
                      <datalist id="client-options">{clients.map((entry) => <option key={entry.id} value={entry.name} />)}</datalist>
                    </label>
                    <label>Data emiterii<input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
                    <label className="wide">Titlul lucrării<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                    <label>Valabilitate<select value={validityDays} onChange={(event) => setValidityDays(event.target.value)}><option value="15">15 zile</option><option value="30">30 zile</option><option value="60">60 zile</option></select></label>
                    <label>Monedă<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>RON</option><option>EUR</option></select></label>
                    <div className="optional-client-fields wide">
                      <div><strong>Date opționale beneficiar</strong><span>Completează doar ce vrei să apară în ofertă.</span></div>
                      <label>CUI / CNP<input value={clientDetails.taxId} onChange={(event) => updateClientDetail("taxId", event.target.value)} placeholder="Opțional" /></label>
                      <label>Persoană de contact<input value={clientDetails.contactPerson} onChange={(event) => updateClientDetail("contactPerson", event.target.value)} placeholder="Opțional" /></label>
                      <label className="wide">Adresă<input value={clientDetails.address} onChange={(event) => updateClientDetail("address", event.target.value)} placeholder="Opțional" /></label>
                      <label>Telefon<input value={clientDetails.phone} onChange={(event) => updateClientDetail("phone", event.target.value)} placeholder="Opțional" /></label>
                      <label>E-mail<input type="email" value={clientDetails.email} onChange={(event) => updateClientDetail("email", event.target.value)} placeholder="Opțional" /></label>
                    </div>
                  </div>
                </section>

                <section className="card items-card">
                  <div className="section-heading items-heading">
                    <span className="step">2</span>
                    <div><h2>Materiale și servicii</h2><p>{catalog.length} articole disponibile · valorile sunt calculate automat</p></div>
                    <div className="item-actions"><button className="catalog-button" onClick={() => setCatalogOpen(true)}>◇ Alege din catalog</button><button className="add-button" onClick={addBlankItem}>＋ Articol liber</button></div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>#</th><th>Articol</th><th>Tip</th><th>UM</th><th>Cant.</th><th>Preț fără TVA</th><th>Preț cu TVA</th><th>TVA</th><th>Total</th><th></th></tr></thead>
                      <tbody>
                        {items.map((item, index) => {
                          const lineSubtotal = item.quantity * item.unitPrice;
                          const lineTotal = lineSubtotal * (1 + item.vatRate / 100);
                          return (
                            <tr key={item.id}>
                              <td className="row-number">{index + 1}</td>
                              <td><input aria-label={`Denumire poziția ${index + 1}`} value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} /></td>
                              <td><select aria-label={`Tip poziția ${index + 1}`} value={item.kind ?? "material"} onChange={(event) => updateItem(item.id, "kind", event.target.value)}><option value="material">Material</option><option value="labor">Serviciu</option><option value="expense">Cost auxiliar</option></select></td>
                              <td><select aria-label={`Unitate poziția ${index + 1}`} value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)}><option value="buc">buc</option><option value="m">m</option><option value="set">set</option><option value="lucrare">lucrare</option><option value="zi">zi</option></select></td>
                              <td><input aria-label={`Cantitate poziția ${index + 1}`} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></td>
                              <td><div className="money-input"><input aria-label={`Preț poziția ${index + 1}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} /><span>{currency === "RON" ? "lei" : "€"}</span></div></td>
                              <td className="unit-price-vat">{money.format(item.unitPrice * (1 + item.vatRate / 100))} {currency === "RON" ? "lei" : "€"}</td>
                              <td><select aria-label={`TVA poziția ${index + 1}`} value={item.vatRate} onChange={(event) => updateItem(item.id, "vatRate", event.target.value)}><option value="21">21%</option><option value="11">11%</option><option value="0">0%</option></select></td>
                              <td className="line-total">{money.format(lineTotal)} {currency === "RON" ? "lei" : "€"}</td>
                              <td><button className="remove" aria-label={`Șterge poziția ${index + 1}`} onClick={() => removeItem(item.id)}>×</button></td>
                            </tr>
                          );
                        })}
                        {items.length === 0 && <tr><td colSpan={10}><button className="empty-items" onClick={() => setCatalogOpen(true)}>Alege primul material sau serviciu din catalog</button></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bottom-grid">
                  <div className="card compact-card">
                    <div className="section-heading"><span className="step">3</span><div><h2>Manoperă și ajustări</h2><p>Costuri finale ale lucrării</p></div></div>
                    <div className="compact-fields">
                      <label>Manoperă <div className="money-input"><input type="number" min="0" value={labor} onChange={(event) => setLabor(Number(event.target.value))} /><span>{currency === "RON" ? "lei" : "€"}</span></div></label>
                      <label>Discount materiale <div className="money-input"><input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /><span>%</span></div></label>
                    </div>
                    {discount > 0 && (
                      <label className="discount-visibility">
                        <input
                          type="checkbox"
                          checked={pdfColumns.showDiscount}
                          onChange={(event) => setPdfColumns((current) => ({ ...current, showDiscount: event.target.checked }))}
                        />
                        Arată discountul clientului în ofertă
                      </label>
                    )}
                  </div>
                  <div className="card totals-card">
                    <div><span>Materiale fără TVA</span><strong>{money.format(totals.subtotal)} {currency === "RON" ? "lei" : "€"}</strong></div>
                    {totals.servicesSubtotal > 0 && <div><span>Servicii din poziții</span><strong>{money.format(totals.servicesSubtotal)} {currency === "RON" ? "lei" : "€"}</strong></div>}
                    {discount > 0 && <div className="discount"><span>Discount ({discount}%)</span><strong>-{money.format(totals.discountAmount)} {currency === "RON" ? "lei" : "€"}</strong></div>}
                    <div><span>TVA total</span><strong>{money.format(totals.vat)} {currency === "RON" ? "lei" : "€"}</strong></div>
                    <div><span>Manoperă globală</span><strong>{money.format(labor)} {currency === "RON" ? "lei" : "€"}</strong></div>
                    <div className="grand-total"><span>Total general</span><strong>{money.format(totals.grand)} {currency === "RON" ? "lei" : "€"}</strong></div>
                  </div>
                </section>

                <section className="card notes-card">
                  <div className="section-heading"><span className="step">4</span><div><h2>Condiții și mențiuni</h2><p>Apar la finalul documentului</p></div></div>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
                </section>
              </div>

              <aside className="preview-card">
                <div className="preview-toolbar">
                  <div><strong>Coloane în ofertă</strong><small>Bifează doar informațiile pe care vrei să le vadă clientul.</small></div>
                  <div className="column-options">
                    {([
                      ["unit", "UM"],
                      ["quantity", "Cantitate"],
                      ["unitPrice", "Preț unitar"],
                      ["total", "Total"],
                    ] as Array<[keyof PdfColumns, string]>).map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={pdfColumns[key]}
                          onChange={(event) => setPdfColumns((current) => ({ ...current, [key]: event.target.checked }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <article className="paper">
                  <div className="paper-header"><div><strong>{companySettings.name.toUpperCase()}</strong><span>CUI {companySettings.taxId} · {companySettings.registrationNumber}</span><span>{companySettings.address}</span><span>Tel. {companySettings.phone}{companySettings.email ? ` · ${companySettings.email}` : ""}</span>{companySettings.iban && <span>IBAN {companySettings.iban}{companySettings.bank ? ` · ${companySettings.bank}` : ""}</span>}</div><Image className="paper-logo-image" src="/brand/electric-smart-logo.jpg" alt="Electric Smart" width={76} height={65} priority /></div>
                  <div className="paper-title"><small>{currentNumber} · {issueDate.split("-").reverse().join(".")}</small><h3>{title || "Titlul lucrării"}</h3><p>Beneficiar: <strong>{client || "Beneficiar"}</strong></p>{Object.values(clientDetails).some(Boolean) && <div className="paper-client-details">{clientDetails.taxId && <span>CUI/CNP: {clientDetails.taxId}</span>}{clientDetails.address && <span>{clientDetails.address}</span>}{clientDetails.contactPerson && <span>Contact: {clientDetails.contactPerson}</span>}{(clientDetails.phone || clientDetails.email) && <span>{[clientDetails.phone, clientDetails.email].filter(Boolean).join(" · ")}</span>}</div>}</div>
                  <table className="paper-table">
                    <thead><tr><th>#</th><th>Descriere</th>{pdfColumns.unit && <th className="center">UM</th>}{pdfColumns.quantity && <th className="numeric">Cantitate</th>}{pdfColumns.unitPrice && <th className="numeric">Preț unitar cu TVA</th>}{pdfColumns.total && <th className="numeric">Total cu TVA</th>}</tr></thead>
                    <tbody>{items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.name}</td>{pdfColumns.unit && <td className="center">{item.unit}</td>}{pdfColumns.quantity && <td className="numeric">{item.quantity}</td>}{pdfColumns.unitPrice && <td className="numeric">{money.format(item.unitPrice * (1 + item.vatRate / 100))}</td>}{pdfColumns.total && <td className="numeric">{money.format(item.quantity * item.unitPrice * (1 + item.vatRate / 100))}</td>}</tr>)}</tbody>
                  </table>
                  <div className="paper-summary"><p><span>{discount > 0 && !pdfColumns.showDiscount ? "Materiale nete fără TVA" : "Materiale fără TVA"}</span><strong>{money.format(discount > 0 && !pdfColumns.showDiscount ? totals.subtotal - totals.discountAmount : totals.subtotal)} {currency === "RON" ? "lei" : "EUR"}</strong></p>{discount > 0 && pdfColumns.showDiscount && <p className="discount"><span>Discount aplicat ({discount}%)</span><strong>-{money.format(totals.discountAmount)} {currency === "RON" ? "lei" : "EUR"}</strong></p>}{totals.servicesSubtotal > 0 && <p><span>Servicii fără TVA</span><strong>{money.format(totals.servicesSubtotal)} {currency === "RON" ? "lei" : "EUR"}</strong></p>}<p><span>TVA total</span><strong>{money.format(totals.vat)} {currency === "RON" ? "lei" : "EUR"}</strong></p><p><span>Manoperă globală</span><strong>{money.format(labor)} {currency === "RON" ? "lei" : "EUR"}</strong></p><p><span>TOTAL GENERAL</span><strong>{money.format(totals.grand)} {currency === "RON" ? "lei" : "EUR"}</strong></p></div>
                  <div className="paper-notes"><strong>Condiții</strong>{notes.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>)}</div>
                </article>
              </aside>
            </div>
          </>
        )}
      </section>

      {catalogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCatalogOpen(false)}>
          <section className="catalog-modal" role="dialog" aria-modal="true" aria-label="Catalog materiale și servicii">
            <header><div><span className="eyebrow">CATALOG LOCAL</span><h2>Alege un material sau serviciu</h2><p>{catalog.length} articole disponibile</p></div><button className="modal-close" onClick={() => setCatalogOpen(false)} aria-label="Închide">×</button></header>
            <div className="catalog-filters">
              <input autoFocus placeholder="Caută după denumire, cod sau specificație…" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} />
              <select value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            </div>
            <div className="catalog-results">
              {filteredCatalog.map((item) => (
                <button className="catalog-result" key={item.id} onClick={() => addCatalogItem(item)}>
                  <span className="catalog-result-icon">◇</span>
                  <span><strong>{item.name}</strong><small>{item.code ? `${item.code} · ` : ""}{item.category} · {item.unit}{item.specifications ? ` · ${item.specifications}` : ""}</small></span>
                  <span className="source-chip">{item.sourceType === "adăugat manual" ? "Adăugat de tine" : item.kind === "labor" ? "Serviciu" : item.sourceType === "ofertă istorică" ? "Folosit anterior" : "Standard"}</span>
                  <span className="catalog-add">＋</span>
                </button>
              ))}
              {filteredCatalog.length === 0 && <div className="catalog-empty">Nu am găsit articole. Poți adăuga un articol liber în ofertă.</div>}
            </div>
            <footer>Prețurile sunt necompletate intenționat și se introduc la momentul ofertării.</footer>
          </section>
        </div>
      )}
    </main>
  );
}
