export type ImportedOfferItem = {
  id: number;
  kind: "material" | "labor" | "expense";
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type ImportedOffer = {
  client: string;
  title: string;
  issueDate: string;
  validityDays: string;
  currency: string;
  items: ImportedOfferItem[];
  labor: number;
  discount: number;
  notes: string;
};

function normalized(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value ?? "");
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const match = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function firstPopulatedSheet(input: unknown): unknown[][] {
  if (!Array.isArray(input)) return [];
  if (input.every((row) => Array.isArray(row))) return input as unknown[][];
  const sheets = input as Array<{ data?: unknown[][] }>;
  return sheets.find((sheet) => Array.isArray(sheet.data) && sheet.data.length)?.data ?? [];
}

function findHeader(rows: unknown[][], requiredGroups: string[][]) {
  return rows.findIndex((row) => {
    const cells = row.map(normalized);
    return requiredGroups.every((group) => cells.some((cell) => group.includes(cell)));
  });
}

function column(headers: unknown[], names: string[]) {
  return headers.map(normalized).findIndex((header) => names.includes(header));
}

function cellText(rows: unknown[][]) {
  return rows.flat().map((cell) => String(cell ?? "").trim()).filter(Boolean);
}

export function parseCatalogRows(rows: unknown[][]) {
  const headerIndex = findHeader(rows.slice(0, 60), [
    ["denumire", "nume", "name", "material", "articol", "serviciimateriale"],
  ]);
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex];
  const historicalOffer = headers.map(normalized).includes("serviciimateriale");
  const indexes = {
    name: column(headers, ["denumire", "nume", "name", "material", "articol", "serviciimateriale"]),
    code: column(headers, ["cod", "code", "sku"]),
    category: column(headers, ["categorie", "category"]),
    subcategory: column(headers, ["subcategorie", "subcategory"]),
    kind: column(headers, ["tip", "kind", "tiparticol"]),
    unit: column(headers, ["um", "unitate", "unit"]),
    price: column(headers, ["pret", "pretunitar", "unitprice", "price", "pretbuc"]),
    vat: column(headers, ["tva", "vatrate", "vat"]),
    net: column(headers, ["pretfaratva", "totalfaratva"]),
    specs: column(headers, ["specificatii", "specificatie", "specifications", "descriere"]),
  };
  return rows.slice(headerIndex + 1).map((row) => {
    const name = String(row[indexes.name] ?? "").trim();
    const kindText = normalized(indexes.kind >= 0 ? row[indexes.kind] : "");
    const kind = kindText.includes("manoper") || kindText.includes("servici")
      ? "labor"
      : kindText.includes("chelt") || kindText.includes("cost")
        ? "expense"
        : "material";
    const rawVat = asNumber(indexes.vat >= 0 ? row[indexes.vat] : 21);
    const net = asNumber(indexes.net >= 0 ? row[indexes.net] : 0);
    const inferredVat = rawVat > 30 && net > 0 ? Math.round((rawVat / net) * 100) : rawVat;
    return {
      id: crypto.randomUUID(),
      code: String(indexes.code >= 0 ? row[indexes.code] ?? "" : "").trim(),
      name,
      category: String(indexes.category >= 0 ? row[indexes.category] ?? "" : "").trim()
        || (kind === "labor" ? "Servicii și manoperă" : "Materiale importate"),
      subcategory: String(indexes.subcategory >= 0 ? row[indexes.subcategory] ?? "" : "").trim(),
      kind,
      unit: String(indexes.unit >= 0 ? row[indexes.unit] ?? "buc" : "buc").trim().toLowerCase(),
      unitPrice: asNumber(indexes.price >= 0 ? row[indexes.price] : 0),
      currency: "RON",
      vatRate: [0, 11, 19, 21].includes(inferredVat) ? inferredVat : 21,
      specifications: String(indexes.specs >= 0 ? row[indexes.specs] ?? "" : "").trim(),
      sourceType: "import Excel",
      active: true,
    };
  }).filter((item) =>
    item.name
    && !normalized(item.name).includes("contravaloare")
    && !normalized(item.name).includes("totalgeneral")
    && (!historicalOffer || item.unitPrice > 0),
  );
}

export function parseLegacyOffer(rows: unknown[][]): ImportedOffer {
  const texts = cellText(rows);
  const joined = texts.join("\n");
  const currency = /\b(?:euro|eur)\b/i.test(joined) ? "EUR" : "RON";
  const title = texts.find((value) => /^oferta\b/i.test(value) && !/valabil/i.test(value)) ?? "Ofertă importată din Excel";
  const beneficiary = texts.find((value) => /beneficiar\s*:/i.test(value));
  const client = beneficiary?.replace(/^.*beneficiar\s*:\s*/i, "").trim()
    || title.replace(/^oferta\s*/i, "").replace(/\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}.*$/, "").trim();
  const dateValue = rows.flat().find((value) => value instanceof Date)
    ?? texts.map(isoDate).find(Boolean);
  const issueDate = isoDate(dateValue) || today();
  const validityMatch = joined.match(/valabil(?:itate|a)?[^\d]{0,20}(\d{1,3})\s*zile/i);
  const discountMatch = joined.match(/discount\s*(\d+(?:[.,]\d+)?)\s*%/i);
  const laborRow = rows.find((row) => row.some((cell) => normalized(cell).includes("contravaloaremanopera")));
  const laborLabelIndex = laborRow?.findIndex((cell) => normalized(cell).includes("contravaloaremanopera")) ?? -1;
  const labor = laborRow ? asNumber(laborRow.slice(laborLabelIndex + 1).find((cell) => asNumber(cell) > 0)) : 0;

  const headerIndex = findHeader(rows.slice(0, 80), [
    ["serviciimateriale", "denumire", "descriere", "articol", "material"],
    ["cantitate", "cant", "qty"],
  ]);
  let items: ImportedOfferItem[] = [];

  if (headerIndex >= 0) {
    const headers = rows[headerIndex];
    const nameIndex = column(headers, ["serviciimateriale", "denumire", "descriere", "articol", "material"]);
    const unitIndex = column(headers, ["um", "unitate", "unit"]);
    const quantityIndex = column(headers, ["cantitate", "cant", "qty"]);
    const priceIndex = column(headers, ["pretbuc", "pretunitar", "pret", "unitprice", "price"]);
    const netIndex = column(headers, ["pretfaratva", "totalfaratva"]);
    const vatIndex = column(headers, ["tva", "vat"]);
    items = rows.slice(headerIndex + 1).map((row, index) => {
      const name = String(row[nameIndex] ?? "").trim();
      const quantity = asNumber(row[quantityIndex]);
      const unitPrice = asNumber(row[priceIndex]);
      const net = asNumber(netIndex >= 0 ? row[netIndex] : 0);
      const vat = asNumber(vatIndex >= 0 ? row[vatIndex] : 0);
      const inferredVat = net > 0 && vat > 0 ? Math.round((vat / net) * 100) : 21;
      return {
        id: index + 1,
        kind: "material" as const,
        name,
        unit: String(unitIndex >= 0 ? row[unitIndex] ?? "buc" : "buc").toLowerCase(),
        quantity,
        unitPrice,
        vatRate: [0, 11, 19, 21].includes(inferredVat) ? inferredVat : 21,
      };
    }).filter((item) => item.name && item.quantity > 0 && item.unitPrice > 0);
  } else {
    // Oferte furnizor fără antet: cod, denumire, disponibilitate, preț unitar, cantitate, total.
    items = rows.map((row, index) => ({
      id: index + 1,
      kind: "material" as const,
      name: String(row[1] ?? "").trim(),
      unit: /metri|metru/i.test(String(row[1] ?? "")) ? "m" : "buc",
      quantity: asNumber(row[4]),
      unitPrice: asNumber(row[3]),
      vatRate: /nu includ tva/i.test(joined) ? 21 : 0,
    })).filter((item) => item.name && item.quantity > 0 && item.unitPrice > 0);
  }

  if (!items.length) throw new Error("Nu am putut identifica pozițiile ofertei.");
  if (/prima pozitie e in metri/i.test(joined) && items[0]) items[0].unit = "m";
  const noteLines = texts.filter((value) =>
    /garantie|valabil|oferta (?:nu )?include|mentiune|preturile sunt|curs euro/i.test(value),
  );
  return {
    client,
    title,
    issueDate,
    validityDays: validityMatch?.[1] ?? "30",
    currency,
    items: items.map((item, index) => ({ ...item, id: index + 1 })),
    labor,
    discount: discountMatch ? asNumber(discountMatch[1]) : 0,
    notes: Array.from(new Set(noteLines)).join("\n"),
  };
}
