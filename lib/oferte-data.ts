import { supabase } from "./supabase";

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function formatDataError(error: unknown, fallback = "Operația a eșuat.") {
  const err = error as SupabaseLikeError;
  const message = err?.message || (error instanceof Error ? error.message : fallback);
  const lower = message.toLowerCase();
  if (
    lower.includes("row-level security")
    || lower.includes("permission denied")
    || err?.code === "42501"
    || err?.code === "PGRST301"
  ) {
    return `Acces refuzat la baza de date (${err?.code || "RLS"}). Rulează migrarea 20260729_fix_offer_save_rls în Supabase SQL Editor. Detaliu: ${message}`;
  }
  if (err?.code === "PGRST202" || lower.includes("could not find the function")) {
    return `Funcția next_offer_number lipsește sau e învechită. Rulează migrarea 20260729_fix_offer_save_rls în Supabase. Detaliu: ${message}`;
  }
  const extras = [err?.code, err?.details, err?.hint].filter(Boolean).join(" · ");
  return extras ? `${message} (${extras})` : message;
}

function throwDataError(error: unknown): never {
  throw new Error(formatDataError(error));
}

export type RemoteCatalogItem = {
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
  active: boolean;
};

export type RemoteClient = {
  id: string;
  type: "firmă" | "persoană fizică";
  name: string;
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
};

export type RemoteCompany = {
  id: string;
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
  industry: string;
  logoPath: string;
  accentColor: string;
  offerPrefix: string;
};

export type RemoteOffer = {
  id: string;
  number: string;
  client: string;
  clientDetails?: {
    taxId: string;
    address: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
  title: string;
  issueDate: string;
  validityDays: string;
  currency: string;
  items: Array<{
    id: number;
    catalogId?: string;
    kind: "material" | "labor" | "expense";
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  labor: number;
  laborOptions?: {
    vatRate: number;
    showLine: boolean;
  };
  discount: number;
  notes: string;
  pdfColumns?: {
    unit: boolean;
    quantity: boolean;
    unitPriceWithoutVat: boolean;
    unitPrice: boolean;
    total: boolean;
    showDiscount: boolean;
  };
  status: "ciornă" | "trimisă" | "acceptată" | "respinsă";
  updatedAt: string;
};

function mapCatalog(row: Record<string, unknown>): RemoteCatalogItem {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    subcategory: String(row.subcategory ?? ""),
    kind: row.kind as RemoteCatalogItem["kind"],
    unit: String(row.unit ?? "buc"),
    unitPrice: Number(row.unit_price ?? 0),
    currency: String(row.currency ?? "RON"),
    vatRate: Number(row.vat_rate ?? 21),
    specifications: String(row.specifications ?? ""),
    sourceType: String(row.source_type ?? "catalog inițial"),
    active: row.active !== false,
  };
}

export type UserCompanySummary = {
  id: string;
  name: string;
  industry: string;
  taxId: string;
  role: string;
};

function mapCompany(row: Record<string, unknown>, companyId: string): RemoteCompany {
  return {
    id: companyId,
    name: String(row.name ?? ""),
    taxId: String(row.tax_id ?? ""),
    registrationNumber: String(row.registration_number ?? ""),
    address: String(row.address ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    iban: String(row.iban ?? ""),
    bank: String(row.bank ?? ""),
    defaultWarranty: Number(row.default_warranty ?? 24),
    defaultValidity: Number(row.default_validity ?? 30),
    industry: String(row.industry ?? "other"),
    logoPath: String(row.logo_path ?? ""),
    accentColor: String(row.accent_color ?? "#2563eb"),
    offerPrefix: String(row.offer_prefix ?? "OF"),
  };
}

export async function listUserCompanies(userId: string): Promise<UserCompanySummary[]> {
  const result = await supabase
    .from("company_members")
    .select("role, company_id, created_at, companies(id, name, industry, tax_id)")
    .eq("user_id", userId)
    .order("created_at");
  if (result.error) throwDataError(result.error);

  return (result.data ?? []).flatMap((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    if (!company) return [];
    return [{
      id: String(company.id ?? row.company_id),
      name: String(company.name ?? "Firmă"),
      industry: String(company.industry ?? "other"),
      taxId: String(company.tax_id ?? ""),
      role: String(row.role ?? "member"),
    }];
  });
}

/** Fallback when company_members is empty or inaccessible: companies owned by the user. */
export async function listOwnedCompanies(userId: string): Promise<UserCompanySummary[]> {
  const owned = await supabase
    .from("companies")
    .select("id, name, industry, tax_id, created_at")
    .eq("owner_id", userId)
    .order("created_at");
  if (owned.error) throwDataError(owned.error);
  return (owned.data ?? []).map((company) => ({
    id: String(company.id),
    name: String(company.name ?? "Firmă"),
    industry: String(company.industry ?? "other"),
    taxId: String(company.tax_id ?? ""),
    role: "owner",
  }));
}

/** Repairs missing owner→member links (common after multi-company migration). */
export async function ensureOwnerMemberships() {
  const rpc = await supabase.rpc("ensure_owner_memberships");
  if (!rpc.error) return Number(rpc.data ?? 0);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throwDataError(userError);
  const userId = userData.user?.id;
  if (!userId) return 0;

  const owned = await listOwnedCompanies(userId);
  if (!owned.length) return 0;

  let repaired = 0;
  for (const company of owned) {
    const membership = await supabase.from("company_members").upsert(
      { company_id: company.id, user_id: userId, role: "owner" },
      { onConflict: "company_id,user_id" },
    );
    if (!membership.error) {
      repaired += 1;
      continue;
    }
    // Some projects only allow insert, not upsert conflict target.
    const inserted = await supabase.from("company_members").insert({
      company_id: company.id,
      user_id: userId,
      role: "owner",
    });
    if (!inserted.error) repaired += 1;
  }
  return repaired;
}

export async function loadBetaData(userId: string, email: string, preferredCompanyId?: string | null) {
  const profileResult = await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  if (profileResult.error) throwDataError(profileResult.error);

  await ensureOwnerMemberships().catch(() => 0);

  let companies: UserCompanySummary[] = [];
  try {
    companies = await listUserCompanies(userId);
  } catch {
    companies = [];
  }
  if (!companies.length) {
    companies = await listOwnedCompanies(userId).catch(() => []);
  }
  if (!companies.length) {
    return {
      needsOnboarding: true as const,
      company: null,
      companies: [] as UserCompanySummary[],
      clients: [] as RemoteClient[],
      catalog: [] as RemoteCatalogItem[],
      offers: [] as RemoteOffer[],
    };
  }

  const selectedSummary = companies.find((company) => company.id === preferredCompanyId) ?? companies[0];
  const companyId = selectedSummary.id;

  let companyRow: Record<string, unknown> | null = null;
  const membership = await supabase
    .from("company_members")
    .select("company_id, role, companies(*)")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership.error) {
    const nested = Array.isArray(membership.data?.companies)
      ? membership.data?.companies[0]
      : membership.data?.companies;
    if (nested) companyRow = nested as Record<string, unknown>;
  }
  if (!companyRow) {
    const direct = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
    if (direct.error) throwDataError(direct.error);
    companyRow = (direct.data as Record<string, unknown> | null) ?? null;
  }
  if (!companyRow) {
    return {
      needsOnboarding: true as const,
      company: null,
      companies: [] as UserCompanySummary[],
      clients: [] as RemoteClient[],
      catalog: [] as RemoteCatalogItem[],
      offers: [] as RemoteOffer[],
    };
  }

  let catalogResult = await supabase.from("catalog_items").select("*").eq("company_id", companyId).order("category").order("name");
  if (catalogResult.error) throwDataError(catalogResult.error);
  if (!catalogResult.data?.length) {
    const catalogFile = companyRow.industry === "windows_doors"
      ? "/catalog-windows-doors.json"
      : companyRow.industry === "electrical" ? "/catalog.json" : null;
    const source = catalogFile
      ? await fetch(catalogFile).then((response) => response.json()) as RemoteCatalogItem[]
      : [];
    const rows = source.map((item) => ({
      owner_id: userId,
      company_id: companyId,
      code: item.code,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      kind: item.kind,
      unit: item.unit,
      unit_price: item.unitPrice || 0,
      currency: item.currency || "RON",
      vat_rate: item.vatRate,
      specifications: item.specifications,
      source_type: item.sourceType,
    }));
    if (rows.length) {
      const seeded = await supabase.from("catalog_items").insert(rows).select("*");
      if (seeded.error) throwDataError(seeded.error);
      catalogResult = seeded;
    }
  }

  const [clientsResult, offersResult] = await Promise.all([
    supabase.from("clients").select("*").eq("company_id", companyId).order("name"),
    supabase.from("offers").select("*, offer_items(*)").eq("company_id", companyId).order("updated_at", { ascending: false }),
  ]);
  if (clientsResult.error) throwDataError(clientsResult.error);
  if (offersResult.error) throwDataError(offersResult.error);

  const company = mapCompany(companyRow as Record<string, unknown>, companyId);
  const clients: RemoteClient[] = (clientsResult.data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    taxId: row.tax_id,
    address: row.address,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
  }));
  const offers: RemoteOffer[] = (offersResult.data ?? []).map((row) => ({
    id: row.id,
    number: row.number,
    client: row.client_name,
    clientDetails: {
      taxId: String(row.client_details?.taxId ?? ""),
      address: String(row.client_details?.address ?? ""),
      contactPerson: String(row.client_details?.contactPerson ?? ""),
      phone: String(row.client_details?.phone ?? ""),
      email: String(row.client_details?.email ?? ""),
    },
    title: row.title,
    issueDate: row.issue_date,
    validityDays: String(row.validity_days),
    currency: row.currency,
    labor: Number(row.labor),
    laborOptions: {
      vatRate: Number(row.labor_options?.vatRate ?? 0),
      showLine: row.labor_options?.showLine !== false,
    },
    discount: Number(row.discount),
    notes: row.notes,
    pdfColumns: {
      unit: row.pdf_columns?.unit !== false,
      quantity: row.pdf_columns?.quantity !== false,
      unitPriceWithoutVat: row.pdf_columns?.unitPriceWithoutVat === true,
      unitPrice: row.pdf_columns?.unitPrice !== false,
      total: row.pdf_columns?.total !== false,
      showDiscount: row.pdf_columns?.showDiscount !== false,
    },
    status: row.status,
    updatedAt: row.updated_at,
    items: (row.offer_items ?? [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((item: Record<string, unknown>, index: number) => ({
        id: index + 1,
        catalogId: item.catalog_item_id ? String(item.catalog_item_id) : undefined,
        kind: item.kind as "material" | "labor" | "expense",
        name: String(item.name),
        unit: String(item.unit),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        vatRate: Number(item.vat_rate),
      })),
  }));

  return {
    needsOnboarding: false as const,
    company,
    companies,
    clients,
    catalog: (catalogResult.data ?? []).map((row) => mapCatalog(row)),
    offers,
  };
}

export async function syncClients(userId: string, companyId: string, clients: RemoteClient[]) {
  if (!clients.length) return;
  const result = await supabase.from("clients").upsert(clients.map((client) => ({
    id: client.id,
    owner_id: userId,
    company_id: companyId,
    type: client.type,
    name: client.name,
    tax_id: client.taxId,
    address: client.address,
    contact_person: client.contactPerson,
    phone: client.phone,
    email: client.email,
    updated_at: new Date().toISOString(),
  })));
  if (result.error) throwDataError(result.error);
}

export async function deleteRemoteClient(id: string) {
  const result = await supabase.from("clients").delete().eq("id", id);
  if (result.error) throwDataError(result.error);
}

export async function syncCompany(userId: string, settings: RemoteCompany) {
  const result = await supabase.from("companies").update({
    owner_id: userId,
    name: settings.name,
    tax_id: settings.taxId,
    registration_number: settings.registrationNumber,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    iban: settings.iban,
    bank: settings.bank,
    default_warranty: settings.defaultWarranty,
    default_validity: settings.defaultValidity,
    industry: settings.industry,
    logo_path: settings.logoPath,
    accent_color: settings.accentColor,
    offer_prefix: settings.offerPrefix,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  }).eq("id", settings.id);
  if (result.error) throwDataError(result.error);
}

export async function saveRemoteOffer(
  userId: string,
  companyId: string,
  offer: RemoteOffer,
  clientId: string | null,
) {
  try {
    await saveRemoteOfferDirect(userId, companyId, offer, clientId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/permission denied|row-level security|Acces refuzat|42501/i.test(message)) {
      throw error instanceof Error ? error : new Error(String(error));
    }
    await saveRemoteOfferViaApi(companyId, offer, clientId);
  }
}

async function saveRemoteOfferDirect(
  userId: string,
  companyId: string,
  offer: RemoteOffer,
  clientId: string | null,
) {
  const saved = await supabase.from("offers").upsert({
    id: offer.id,
    owner_id: userId,
    company_id: companyId,
    client_id: clientId,
    number: offer.number,
    client_name: offer.client,
    client_details: offer.clientDetails ?? {},
    title: offer.title,
    issue_date: offer.issueDate,
    validity_days: Number(offer.validityDays),
    currency: offer.currency,
    labor: offer.labor,
    labor_options: offer.laborOptions ?? { vatRate: 0, showLine: true },
    discount: offer.discount,
    notes: offer.notes,
    pdf_columns: offer.pdfColumns ?? { unit: true, quantity: true, unitPriceWithoutVat: false, unitPrice: true, total: true, showDiscount: true },
    status: offer.status,
    updated_at: offer.updatedAt,
  }).select("id").single();
  if (saved.error) throwDataError(saved.error);

  const removed = await supabase.from("offer_items").delete().eq("offer_id", offer.id);
  if (removed.error) throwDataError(removed.error);
  if (offer.items.length) {
    const inserted = await supabase.from("offer_items").insert(offer.items.map((item, index) => ({
      offer_id: offer.id,
      owner_id: userId,
      company_id: companyId,
      catalog_item_id: item.catalogId && !item.catalogId.startsWith("CUS-") ? item.catalogId : null,
      position: index + 1,
      kind: item.kind ?? "material",
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
    })));
    if (inserted.error) throwDataError(inserted.error);
  }
}

async function saveRemoteOfferViaApi(
  companyId: string,
  offer: RemoteOffer,
  clientId: string | null,
) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throwDataError(sessionError);
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sesiunea a expirat. Autentifică-te din nou.");

  const response = await fetch("/api/save-offer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyId, clientId, offer }),
  });
  const payload = await response.json().catch(() => ({} as { error?: string }));
  if (!response.ok) {
    throw new Error(payload.error || `Salvarea prin API a eșuat (${response.status}).`);
  }
}

export async function deleteRemoteOffer(id: string) {
  const result = await supabase.from("offers").delete().eq("id", id);
  if (result.error) throwDataError(result.error);
}

export async function updateRemoteOfferStatus(id: string, status: RemoteOffer["status"]) {
  const result = await supabase
    .from("offers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .single();
  if (result.error) throwDataError(result.error);
  return result.data;
}

export async function addRemoteCatalogItems(userId: string, companyId: string, items: RemoteCatalogItem[]) {
  if (!items.length) return [] as RemoteCatalogItem[];
  const result = await supabase.from("catalog_items").insert(items.map((item) => ({
    owner_id: userId,
    company_id: companyId,
    code: item.code,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    kind: item.kind,
    unit: item.unit,
    unit_price: item.unitPrice,
    currency: item.currency,
    vat_rate: item.vatRate,
    specifications: item.specifications,
    source_type: item.sourceType,
    active: item.active,
  }))).select("*");
  if (result.error) throwDataError(result.error);
  return (result.data ?? []).map((row) => mapCatalog(row));
}

export async function allocateOfferNumber(year: number, companyId: string, offerPrefix = "OF") {
  const result = await supabase.rpc("next_offer_number", { p_year: year, p_company_id: companyId });
  if (!result.error && result.data) return String(result.data);

  // Works without SQL / offer_sequences access: derive next number from existing offers.
  const existing = await supabase.from("offers").select("number").eq("company_id", companyId);
  if (existing.error) {
    // Last resort: also try owner-scoped legacy rows if company filter is blocked.
    const legacy = await supabase.from("offers").select("number");
    if (legacy.error) throwDataError(result.error || existing.error);
    return nextNumberFromList(legacy.data ?? [], year, offerPrefix);
  }
  return nextNumberFromList(existing.data ?? [], year, offerPrefix);
}

function nextNumberFromList(
  rows: Array<{ number?: string | null }>,
  year: number,
  offerPrefix: string,
) {
  let max = 0;
  for (const row of rows) {
    const value = String(row.number ?? "");
    const match = value.match(new RegExp(`(?:^|-)${year}-(\\d+)$`)) || value.match(/-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  const prefix = (offerPrefix || "OF").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "OF";
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

export async function createCompanyForUser(
  userId: string,
  email: string,
  input: { name: string; industry: string; taxId?: string; phone?: string },
) {
  const profile = await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  if (profile.error) throwDataError(profile.error);
  const inserted = await supabase.from("companies").insert({
    owner_id: userId,
    name: input.name,
    industry: input.industry,
    tax_id: input.taxId ?? "",
    phone: input.phone ?? "",
    email,
    default_warranty: input.industry === "windows_doors" ? 24 : 24,
    default_validity: 30,
    onboarding_completed: true,
  }).select("*").single();
  if (inserted.error) throwDataError(inserted.error);
  const membership = await supabase.from("company_members").insert({
    company_id: inserted.data.id,
    user_id: userId,
    role: "owner",
  });
  if (membership.error) {
    await supabase.from("companies").delete().eq("id", inserted.data.id);
    throwDataError(membership.error);
  }
  return String(inserted.data.id);
}

export async function uploadCompanyLogo(companyId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${companyId}/logo.${extension}`;
  const upload = await supabase.storage.from("company-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (upload.error) throwDataError(upload.error);
  return path;
}

export function companyLogoUrl(path: string) {
  if (!path) return "";
  return supabase.storage.from("company-assets").getPublicUrl(path).data.publicUrl;
}

export async function updateRemoteCatalogItem(item: RemoteCatalogItem) {
  const result = await supabase.from("catalog_items").update({
    code: item.code,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    kind: item.kind,
    unit: item.unit,
    unit_price: item.unitPrice,
    currency: item.currency,
    vat_rate: item.vatRate,
    specifications: item.specifications,
    source_type: item.sourceType,
    active: item.active,
    updated_at: new Date().toISOString(),
  }).eq("id", item.id).select("*").single();
  if (result.error) throwDataError(result.error);
  return mapCatalog(result.data);
}

export async function deleteRemoteCatalogItem(id: string) {
  const result = await supabase.from("catalog_items").delete().eq("id", id);
  if (result.error) throwDataError(result.error);
}
