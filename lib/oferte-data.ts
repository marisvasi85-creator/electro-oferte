import { supabase } from "./supabase";

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

export type RemoteOffer = {
  id: string;
  number: string;
  client: string;
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
  discount: number;
  notes: string;
  pdfColumns?: {
    unit: boolean;
    quantity: boolean;
    unitPrice: boolean;
    total: boolean;
    showDiscount: boolean;
  };
  status: "ciornă" | "trimisă" | "acceptată" | "respinsă";
  updatedAt: string;
};

const defaultCompany: RemoteCompany = {
  name: "ElectricSmart.Co S.R.L.",
  taxId: "47684690",
  registrationNumber: "J02/287/2023",
  address: "România, Arad, Socodor, nr. 77",
  phone: "0751 970 357",
  email: "info@frizeo.ro",
  iban: "",
  bank: "",
  defaultWarranty: 24,
  defaultValidity: 30,
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
  };
}

export async function loadBetaData(userId: string, email: string) {
  const profileResult = await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  if (profileResult.error) throw profileResult.error;

  const { data: initialCompanyRow, error: companyError } = await supabase.from("companies").select("*").maybeSingle();
  if (companyError) throw companyError;
  let companyRow = initialCompanyRow;
  if (!companyRow) {
    const inserted = await supabase.from("companies").insert({
      owner_id: userId,
      name: defaultCompany.name,
      tax_id: defaultCompany.taxId,
      registration_number: defaultCompany.registrationNumber,
      address: defaultCompany.address,
      phone: defaultCompany.phone,
      email: defaultCompany.email,
      iban: defaultCompany.iban,
      bank: defaultCompany.bank,
      default_warranty: defaultCompany.defaultWarranty,
      default_validity: defaultCompany.defaultValidity,
    }).select().single();
    if (inserted.error) throw inserted.error;
    companyRow = inserted.data;
  }

  let catalogResult = await supabase.from("catalog_items").select("*").order("category").order("name");
  if (catalogResult.error) throw catalogResult.error;
  if (!catalogResult.data?.length) {
    const source = await fetch("/catalog.json").then((response) => response.json()) as RemoteCatalogItem[];
    const rows = source.map((item) => ({
      owner_id: userId,
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
    const seeded = await supabase.from("catalog_items").insert(rows).select("*");
    if (seeded.error) throw seeded.error;
    catalogResult = seeded;
  }

  const [clientsResult, offersResult] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("offers").select("*, offer_items(*)").order("updated_at", { ascending: false }),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (offersResult.error) throw offersResult.error;

  const company: RemoteCompany = {
    name: companyRow.name,
    taxId: companyRow.tax_id,
    registrationNumber: companyRow.registration_number,
    address: companyRow.address,
    phone: companyRow.phone,
    email: companyRow.email,
    iban: companyRow.iban,
    bank: companyRow.bank,
    defaultWarranty: companyRow.default_warranty,
    defaultValidity: companyRow.default_validity,
  };
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
    title: row.title,
    issueDate: row.issue_date,
    validityDays: String(row.validity_days),
    currency: row.currency,
    labor: Number(row.labor),
    discount: Number(row.discount),
    notes: row.notes,
    pdfColumns: {
      unit: row.pdf_columns?.unit !== false,
      quantity: row.pdf_columns?.quantity !== false,
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
    company,
    clients,
    catalog: (catalogResult.data ?? []).map((row) => mapCatalog(row)),
    offers,
  };
}

export async function syncClients(userId: string, clients: RemoteClient[]) {
  if (!clients.length) return;
  const result = await supabase.from("clients").upsert(clients.map((client) => ({
    id: client.id,
    owner_id: userId,
    type: client.type,
    name: client.name,
    tax_id: client.taxId,
    address: client.address,
    contact_person: client.contactPerson,
    phone: client.phone,
    email: client.email,
    updated_at: new Date().toISOString(),
  })));
  if (result.error) throw result.error;
}

export async function deleteRemoteClient(id: string) {
  const result = await supabase.from("clients").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function syncCompany(userId: string, settings: RemoteCompany) {
  const result = await supabase.from("companies").upsert({
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
    updated_at: new Date().toISOString(),
  }, { onConflict: "owner_id" });
  if (result.error) throw result.error;
}

export async function saveRemoteOffer(
  userId: string,
  offer: RemoteOffer,
  clientId: string | null,
) {
  const saved = await supabase.from("offers").upsert({
    id: offer.id,
    owner_id: userId,
    client_id: clientId,
    number: offer.number,
    client_name: offer.client,
    title: offer.title,
    issue_date: offer.issueDate,
    validity_days: Number(offer.validityDays),
    currency: offer.currency,
    labor: offer.labor,
    discount: offer.discount,
    notes: offer.notes,
    pdf_columns: offer.pdfColumns ?? { unit: true, quantity: true, unitPrice: true, total: true, showDiscount: true },
    status: offer.status,
    updated_at: offer.updatedAt,
  }).select("id").single();
  if (saved.error) throw saved.error;

  const removed = await supabase.from("offer_items").delete().eq("offer_id", offer.id);
  if (removed.error) throw removed.error;
  if (offer.items.length) {
    const inserted = await supabase.from("offer_items").insert(offer.items.map((item, index) => ({
      offer_id: offer.id,
      owner_id: userId,
      catalog_item_id: item.catalogId && !item.catalogId.startsWith("CUS-") ? item.catalogId : null,
      position: index + 1,
      kind: item.kind ?? "material",
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
    })));
    if (inserted.error) throw inserted.error;
  }
}

export async function deleteRemoteOffer(id: string) {
  const result = await supabase.from("offers").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function addRemoteCatalogItems(userId: string, items: RemoteCatalogItem[]) {
  if (!items.length) return [] as RemoteCatalogItem[];
  const result = await supabase.from("catalog_items").insert(items.map((item) => ({
    owner_id: userId,
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
  }))).select("*");
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => mapCatalog(row));
}
