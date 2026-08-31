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
  let text = String(value ?? "").trim().replace(/\s/g, "").replace(/lei|ron|eur|€/gi, "");
  if (!text) return 0;
  // European formats: 1.234,56 or 1,234.56
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replace(/,/g, "");
  else text = text.replace(",", ".");
  const parsed = Number(text);
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
  const sheets = listSheetMatrices(input);
  if (!sheets.length) return [];
  return pickBestOfferSheet(sheets);
}

/** Normalize read-excel-file output (rows matrix OR sheets array) into sheet matrices. */
export function listSheetMatrices(input: unknown): unknown[][][] {
  if (!Array.isArray(input) || input.length === 0) return [];
  if (input.every((row) => Array.isArray(row))) return [input as unknown[][]];
  return (input as Array<{ data?: unknown[][] }>)
    .map((sheet) => sheet.data)
    .filter((data): data is unknown[][] => Array.isArray(data) && data.length > 0);
}

const OFFER_NAME_HEADERS = [
  "serviciimateriale",
  "denumire",
  "descriere",
  "articol",
  "material",
  "produs",
  "lucrare",
  "pozitie",
  "name",
];
const OFFER_QTY_HEADERS = ["cantitate", "cant", "qty", "quantity", "nrbuc"];
const OFFER_PRICE_HEADERS = [
  "pretbuc",
  "pretunitarfaratva",
  "pretunitarfara",
  "pretunitar",
  "unitprice",
  "price",
];
const OFFER_NET_HEADERS = ["pretfaratva", "totalfaratva", "valoarefaratva", "valoare"];
const OFFER_TOTAL_HEADERS = ["totalcutva", "total", "valoaretva"];

function isUnitPriceHeader(cell: string) {
  return (
    cell.includes("unitar")
    || cell.includes("buc")
    || cell === "pret"
    || cell === "price"
    || cell === "unitprice"
  ) && !cell.includes("total") && !/^pretfaratva$/.test(cell);
}

function scoreOfferSheet(rows: unknown[][]): number {
  const headerIndex = findHeader(rows.slice(0, 100), [OFFER_NAME_HEADERS, OFFER_QTY_HEADERS]);
  if (headerIndex < 0) {
    // Prefer denser sheets when no header is found.
    return rows.reduce((sum, row) => sum + row.filter((cell) => String(cell ?? "").trim()).length, 0) * 0.01;
  }
  const headers = rows[headerIndex];
  let score = 1000 + (rows.length - headerIndex);
  if (unitPriceColumn(headers) >= 0) score += 250;
  else if (column(headers, OFFER_NET_HEADERS) >= 0 || column(headers, OFFER_TOTAL_HEADERS) >= 0) score += 120;
  if (column(headers, ["um", "unitate", "unit"]) >= 0) score += 50;
  return score;
}

export function pickBestOfferSheet(sheets: unknown[][][]): unknown[][] {
  if (!sheets.length) return [];
  return [...sheets].sort((a, b) => scoreOfferSheet(b) - scoreOfferSheet(a))[0] ?? [];
}

function headerMatches(cell: string, candidate: string) {
  if (!cell || !candidate) return false;
  if (cell === candidate) return true;
  // Accept longer Excel headers like "pretunitarfaratva" for "pretunitar".
  // Do NOT reverse-match short cells into longer candidates ("pretfaratva" ≠ "pretunitarfaratva").
  if (candidate.length >= 4 && cell.startsWith(candidate)) return true;
  if (candidate.length >= 6 && cell.includes(candidate)) return true;
  return false;
}

function unitPriceColumn(headers: unknown[]) {
  const cells = headers.map(normalized);
  const exactPreferred = cells.findIndex((cell) =>
    ["pretbuc", "pretunitarfaratva", "pretunitarfara", "pretunitar", "unitprice"].includes(cell),
  );
  if (exactPreferred >= 0) return exactPreferred;
  const fuzzyPreferred = cells.findIndex((cell) =>
    OFFER_PRICE_HEADERS.some((name) => headerMatches(cell, name)) && isUnitPriceHeader(cell),
  );
  if (fuzzyPreferred >= 0) return fuzzyPreferred;
  // Last resort: bare "pret" / "price" that is not a total column.
  return cells.findIndex((cell) => (cell === "pret" || cell === "price") && !cell.includes("total"));
}

function findHeader(rows: unknown[][], requiredGroups: string[][]) {
  return rows.findIndex((row) => {
    const cells = row.map(normalized);
    return requiredGroups.every((group) =>
      cells.some((cell) => group.some((candidate) => headerMatches(cell, candidate))),
    );
  });
}

function column(headers: unknown[], names: string[]) {
  const cells = headers.map(normalized);
  for (const name of names) {
    const exact = cells.findIndex((cell) => cell === name);
    if (exact >= 0) return exact;
  }
  for (const name of names) {
    const fuzzy = cells.findIndex((cell) => headerMatches(cell, name));
    if (fuzzy >= 0) return fuzzy;
  }
  return -1;
}

function cellText(rows: unknown[][]) {
  return rows.flat().map((cell) => String(cell ?? "").trim()).filter(Boolean);
}

function inferKind(value: unknown): ImportedOfferItem["kind"] {
  const text = normalized(value);
  if (text.includes("labor") || text.includes("manoper") || text.includes("servici")) return "labor";
  if (text.includes("expense") || text.includes("chelt") || text.includes("cost")) return "expense";
  return "material";
}

function extractClient(rows: unknown[][], texts: string[], title: string) {
  for (const row of rows) {
    for (let index = 0; index < row.length; index += 1) {
      const cell = String(row[index] ?? "").trim();
      if (/^beneficiar\s*:/i.test(cell)) {
        const inline = cell.replace(/^.*beneficiar\s*:\s*/i, "").trim();
        if (inline) return inline;
        const next = String(row[index + 1] ?? "").trim();
        if (next) return next;
      }
      if (/^beneficiar$/i.test(cell)) {
        const next = String(row[index + 1] ?? "").trim();
        if (next) return next;
      }
    }
  }
  const beneficiary = texts.find((value) => /beneficiar\s*:/i.test(value));
  if (beneficiary) return beneficiary.replace(/^.*beneficiar\s*:\s*/i, "").trim();
  return title.replace(/^oferta\s*/i, "").replace(/\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}.*$/i, "").trim();
}

export function parseCatalogRows(rows: unknown[][]) {
  const headerIndex = findHeader(rows.slice(0, 60), [
    ["denumire", "nume", "name", "material", "articol", "serviciimateriale", "descriere"],
  ]);
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex];
  const historicalOffer = headers.map(normalized).some((cell) => headerMatches(cell, "serviciimateriale"));
  const indexes = {
    name: column(headers, ["denumire", "nume", "name", "descriere", "material", "articol", "serviciimateriale"]),
    code: column(headers, ["cod", "code", "sku"]),
    category: column(headers, ["categorie", "category"]),
    subcategory: column(headers, ["subcategorie", "subcategory"]),
    kind: column(headers, ["tip", "kind", "tiparticol"]),
    unit: column(headers, ["um", "unitate", "unit"]),
    price: column(headers, ["pretbuc", "pretunitarfaratva", "pretunitar", "unitprice", "price", "pret"]),
    vat: column(headers, ["tva", "vatrate", "vat"]),
    net: column(headers, ["pretfaratva", "totalfaratva"]),
    specs: column(headers, ["specificatii", "specificatie", "specifications", "descriere"]),
  };
  // Prefer a dedicated specs column; don't reuse the name column.
  if (indexes.specs === indexes.name) indexes.specs = -1;

  return rows.slice(headerIndex + 1).map((row) => {
    const name = String(row[indexes.name] ?? "").trim();
    const kind = indexes.kind >= 0 ? inferKind(row[indexes.kind]) : "material";
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
  if (!rows.length) {
    throw new Error("Fișierul Excel pare gol sau nu a putut fi citit.");
  }

  const texts = cellText(rows);
  const joined = texts.join("\n");
  const currency = /\b(?:euro|eur)\b/i.test(joined) ? "EUR" : "RON";
  const title = texts.find((value) => /^oferta\b/i.test(value) && !/valabil/i.test(value)) ?? "Ofertă importată din Excel";
  const client = extractClient(rows, texts, title) || "Client importat";
  const dateValue = rows.flat().find((value) => value instanceof Date)
    ?? texts.map(isoDate).find(Boolean);
  const issueDate = isoDate(dateValue) || today();
  const validityMatch = joined.match(/valabil(?:itate|a)?[^\d]{0,20}(\d{1,3})\s*zile/i);
  const discountMatch = joined.match(/discount\s*(\d+(?:[.,]\d+)?)\s*%/i);
  const laborRow = rows.find((row) => row.some((cell) => normalized(cell).includes("contravaloaremanopera")));
  const laborLabelIndex = laborRow?.findIndex((cell) => normalized(cell).includes("contravaloaremanopera")) ?? -1;
  const labor = laborRow ? asNumber(laborRow.slice(laborLabelIndex + 1).find((cell) => asNumber(cell) > 0)) : 0;

  const headerIndex = findHeader(rows.slice(0, 100), [OFFER_NAME_HEADERS, OFFER_QTY_HEADERS]);
  let items: ImportedOfferItem[] = [];

  if (headerIndex >= 0) {
    const headers = rows[headerIndex];
    const nameIndex = column(headers, OFFER_NAME_HEADERS);
    const kindIndex = column(headers, ["tip", "kind", "tiparticol"]);
    const unitIndex = column(headers, ["um", "unitate", "unit"]);
    const quantityIndex = column(headers, OFFER_QTY_HEADERS);
    const priceIndex = unitPriceColumn(headers);
    const netIndex = column(headers, OFFER_NET_HEADERS);
    const totalIndex = column(headers, OFFER_TOTAL_HEADERS);
    const vatIndex = column(headers, ["tva", "vatrate", "vat"]);

    items = rows.slice(headerIndex + 1).map((row, index) => {
      const name = String(row[nameIndex] ?? "").trim();
      const quantity = asNumber(row[quantityIndex]);
      let unitPrice = asNumber(priceIndex >= 0 ? row[priceIndex] : 0);
      const net = asNumber(netIndex >= 0 ? row[netIndex] : 0);
      const total = asNumber(totalIndex >= 0 ? row[totalIndex] : 0);
      if (unitPrice <= 0 && quantity > 0 && net > 0) unitPrice = net / quantity;
      if (unitPrice <= 0 && quantity > 0 && total > 0) unitPrice = total / quantity;
      const vat = asNumber(vatIndex >= 0 ? row[vatIndex] : 0);
      // Absolute VAT amount → percent; already-percent values stay as-is.
      const inferredVat = vat > 30 && net > 0
        ? Math.round((vat / net) * 100)
        : vat > 0 && vat <= 30
          ? Math.round(vat)
          : 21;
      return {
        id: index + 1,
        kind: kindIndex >= 0 ? inferKind(row[kindIndex]) : "material" as const,
        name,
        unit: String(unitIndex >= 0 ? row[unitIndex] ?? "buc" : "buc").toLowerCase() || "buc",
        quantity,
        unitPrice: Number(unitPrice.toFixed(4)),
        vatRate: [0, 11, 19, 21].includes(inferredVat) ? inferredVat : 21,
      };
    }).filter((item) => {
      const key = normalized(item.name);
      if (!item.name || item.quantity <= 0 || item.unitPrice <= 0) return false;
      if (key.includes("contravaloare") || key.includes("totalgeneral") || key.includes("discount")) return false;
      if (key.includes("materialecosturi") || key.includes("serviciidin") || key.includes("tvapozit")) return false;
      if (key === "manopera" || key === "total" || key === "subtotal") return false;
      return true;
    });
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

  if (!items.length) {
    throw new Error(
      "Nu am putut identifica pozițiile ofertei. Folosește un .xlsx cu coloane: Descriere/Denumire, Cantitate, Preț unitar.",
    );
  }
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

/** Pick the best sheet from a workbook (or matrix) and parse it as an offer. */
export function parseLegacyOfferWorkbook(input: unknown): ImportedOffer {
  const sheets = listSheetMatrices(input);
  if (!sheets.length) {
    throw new Error("Nu am găsit date în Excel. Verifică că fișierul .xlsx are un sheet cu poziții.");
  }

  const ranked = [...sheets].sort((a, b) => scoreOfferSheet(b) - scoreOfferSheet(a));
  let lastError: Error | null = null;
  for (const sheet of ranked) {
    try {
      return parseLegacyOffer(sheet);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error("Nu am putut identifica pozițiile ofertei în niciun sheet.");
}
