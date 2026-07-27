import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";

type PdfItem = {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

type PdfCompany = {
  name: string;
  taxId: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  iban: string;
  bank: string;
};

type PdfTotals = {
  subtotal: number;
  servicesSubtotal: number;
  discountAmount: number;
  vat: number;
  laborTotal: number;
  grand: number;
};

type GenerateOfferPdfInput = {
  number: string;
  client: string;
  clientDetails: {
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
  items: PdfItem[];
  labor: number;
  laborOptions: {
    vatRate: number;
    showLine: boolean;
  };
  discount: number;
  notes: string;
  company: PdfCompany;
  totals: PdfTotals;
  columns: {
    unit: boolean;
    quantity: boolean;
    unitPriceWithoutVat: boolean;
    unitPrice: boolean;
    total: boolean;
    showDiscount: boolean;
  };
};

const navy = rgb(23 / 255, 34 / 255, 56 / 255);
const blue = rgb(37 / 255, 99 / 255, 235 / 255);
const gray = rgb(100 / 255, 110 / 255, 126 / 255);
const light = rgb(235 / 255, 238 / 255, 243 / 255);
const yellow = rgb(250 / 255, 204 / 255, 21 / 255);

function formatMoney(value: number) {
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawRight(page: PDFPage, text: string, right: number, y: number, font: PDFFont, size: number, color = navy) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, font, size, color });
}

export async function generateOfferPdf(input: GenerateOfferPdfInput) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes, logoBytes] = await Promise.all([
    fetch("/fonts/DejaVuSans.ttf").then((response) => response.arrayBuffer()),
    fetch("/fonts/DejaVuSans-Bold.ttf").then((response) => response.arrayBuffer()),
    fetch("/brand/electric-smart-logo.jpg").then((response) => response.arrayBuffer()),
  ]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const logo = await pdf.embedJpg(logoBytes);

  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;

  const drawDocumentHeader = (target: PDFPage, continuation = false) => {
    target.drawRectangle({ x: 0, y: 830, width: 595.28, height: 12, color: yellow });
    if (!continuation) {
      target.drawText(input.company.name.toUpperCase(), { x: 40, y: 790, font: bold, size: 13, color: navy });
      const companyLines = [
        `CUI ${input.company.taxId}${input.company.registrationNumber ? ` | ${input.company.registrationNumber}` : ""}`,
        input.company.address,
        `${input.company.phone}${input.company.email ? ` | ${input.company.email}` : ""}`,
        input.company.iban ? `IBAN ${input.company.iban}${input.company.bank ? ` | ${input.company.bank}` : ""}` : "",
      ].filter(Boolean);
      companyLines.forEach((line, index) => target.drawText(line, { x: 40, y: 773 - index * 12, font: regular, size: 7.5, color: gray }));
      target.drawImage(logo, { x: 466, y: 735, width: 82, height: 70 });
      target.drawLine({ start: { x: 40, y: 720 }, end: { x: 555, y: 720 }, thickness: 1, color: light });
    } else {
      target.drawText(`${input.number} - continuare`, { x: 40, y: 800, font: bold, size: 9, color: navy });
      target.drawImage(logo, { x: 510, y: 782, width: 35, height: 30 });
    }
  };

  const fixedWidth =
    24 +
    (input.columns.unit ? 36 : 0) +
    (input.columns.quantity ? 48 : 0) +
    (input.columns.unitPriceWithoutVat ? 86 : 0) +
    (input.columns.unitPrice ? 86 : 0) +
    (input.columns.total ? 90 : 0);
  const descriptionWidth = 515 - fixedWidth;
  const tableColumns = [
    { key: "index", label: "#", width: 24, align: "left" },
    { key: "description", label: "Descriere", width: descriptionWidth, align: "left" },
    ...(input.columns.unit ? [{ key: "unit", label: "UM", width: 36, align: "center" }] : []),
    ...(input.columns.quantity ? [{ key: "quantity", label: "Cantitate", width: 48, align: "right" }] : []),
    ...(input.columns.unitPriceWithoutVat ? [{ key: "unitPriceWithoutVat", label: "Preț unitar fără TVA", width: 86, align: "right" }] : []),
    ...(input.columns.unitPrice ? [{ key: "unitPrice", label: "Preț unitar cu TVA", width: 86, align: "right" }] : []),
    ...(input.columns.total ? [{ key: "total", label: "Total cu TVA", width: 90, align: "right" }] : []),
  ];

  const drawTableHeader = (target: PDFPage, top: number) => {
    const x = 40;
    target.drawRectangle({ x, y: top - 22, width: 515, height: 22, color: navy });
    let cursor = x;
    tableColumns.forEach((column) => {
      const size = column.key === "unitPrice" || column.key === "unitPriceWithoutVat" ? 5.4 : 7;
      if (column.align === "right") {
        drawRight(target, column.label, cursor + column.width - 5, top - 14, bold, size, rgb(1, 1, 1));
      } else if (column.align === "center") {
        const labelWidth = bold.widthOfTextAtSize(column.label, size);
        target.drawText(column.label, { x: cursor + (column.width - labelWidth) / 2, y: top - 14, font: bold, size, color: rgb(1, 1, 1) });
      } else {
        target.drawText(column.label, { x: cursor + 5, y: top - 14, font: bold, size, color: rgb(1, 1, 1) });
      }
      cursor += column.width;
    });
    return top - 22;
  };

  drawDocumentHeader(page);
  page.drawText("OFERTĂ", { x: 40, y: 688, font: bold, size: 22, color: navy });
  page.drawText(input.number, { x: 40, y: 672, font: bold, size: 9, color: blue });
  drawRight(page, `Data: ${input.issueDate.split("-").reverse().join(".")}`, 555, 688, regular, 8, gray);
  drawRight(page, `Valabilitate: ${input.validityDays} zile`, 555, 674, regular, 8, gray);
  page.drawText("Beneficiar", { x: 40, y: 642, font: regular, size: 7, color: gray });
  page.drawText(input.client || "Beneficiar necompletat", { x: 40, y: 626, font: bold, size: 11, color: navy });
  const clientDetailLines = [
    input.clientDetails.taxId ? `CUI/CNP: ${input.clientDetails.taxId}` : "",
    input.clientDetails.address,
    [
      input.clientDetails.contactPerson ? `Contact: ${input.clientDetails.contactPerson}` : "",
      input.clientDetails.phone,
      input.clientDetails.email,
    ].filter(Boolean).join(" | "),
  ].filter(Boolean).flatMap((line) => wrapText(line, regular, 7, 245));
  clientDetailLines.slice(0, 5).forEach((line, index) => {
    page.drawText(line, { x: 40, y: 612 - index * 10, font: regular, size: 7, color: gray });
  });
  page.drawText("Lucrare", { x: 300, y: 642, font: regular, size: 7, color: gray });
  const titleLines = wrapText(input.title || "Lucrare fără titlu", bold, 10, 250).slice(0, 2);
  titleLines.forEach((line, index) => page.drawText(line, { x: 300, y: 626 - index * 12, font: bold, size: 10, color: navy }));
  y = drawTableHeader(page, clientDetailLines.length ? 550 : 590);

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    const descriptionLines = wrapText(item.name, regular, 7.3, descriptionWidth - 18);
    const rowHeight = Math.max(22, descriptionLines.length * 10 + 8);
    if (y - rowHeight < 100) {
      page = pdf.addPage([595.28, 841.89]);
      drawDocumentHeader(page, true);
      y = drawTableHeader(page, 770);
    }
    if (index % 2 === 1) page.drawRectangle({ x: 40, y: y - rowHeight, width: 515, height: rowHeight, color: rgb(248 / 255, 249 / 255, 251 / 255) });
    page.drawLine({ start: { x: 40, y: y - rowHeight }, end: { x: 555, y: y - rowHeight }, thickness: 0.5, color: light });
    const unitWithVat = item.unitPrice * (1 + item.vatRate / 100);
    const lineWithVat = item.quantity * unitWithVat;
    let cursor = 40;
    tableColumns.forEach((column) => {
      if (column.key === "index") {
        page.drawText(String(index + 1), { x: cursor + 6, y: y - 15, font: regular, size: 7, color: gray });
      } else if (column.key === "description") {
        descriptionLines.forEach((line, lineIndex) => page.drawText(line, { x: cursor + 5, y: y - 15 - lineIndex * 10, font: regular, size: 7.3, color: navy }));
      } else if (column.key === "unit") {
        const textWidth = regular.widthOfTextAtSize(item.unit, 7);
        page.drawText(item.unit, { x: cursor + (column.width - textWidth) / 2, y: y - 15, font: regular, size: 7, color: navy });
      } else if (column.key === "quantity") {
        drawRight(page, String(item.quantity), cursor + column.width - 5, y - 15, regular, 7, navy);
      } else if (column.key === "unitPriceWithoutVat") {
        drawRight(page, formatMoney(item.unitPrice), cursor + column.width - 5, y - 15, regular, 7, navy);
      } else if (column.key === "unitPrice") {
        drawRight(page, formatMoney(unitWithVat), cursor + column.width - 5, y - 15, regular, 7, navy);
      } else if (column.key === "total") {
        drawRight(page, formatMoney(lineWithVat), cursor + column.width - 5, y - 15, bold, 7, navy);
      }
      cursor += column.width;
    });
    y -= rowHeight;
  }

  if (y < 250) {
    page = pdf.addPage([595.28, 841.89]);
    drawDocumentHeader(page, true);
    y = 750;
  }

  const currencyLabel = input.currency === "RON" ? "lei" : "EUR";
  const summaryX = 330;
  const summaryRight = 555;
  y -= 24;
  const summaryRows: Array<[string, number, boolean?]> = [
    [
      input.discount > 0 && !input.columns.showDiscount ? "Materiale nete fără TVA" : "Materiale fără TVA",
      input.discount > 0 && !input.columns.showDiscount
        ? input.totals.subtotal - input.totals.discountAmount
        : input.totals.subtotal,
    ],
    ...(input.totals.servicesSubtotal > 0 ? [["Servicii fără TVA", input.totals.servicesSubtotal] as [string, number]] : []),
    ...(input.discount > 0 && input.columns.showDiscount ? [[`Discount materiale (${input.discount}%)`, -input.totals.discountAmount] as [string, number]] : []),
    ["TVA total", input.totals.vat],
    ...(input.labor > 0 && input.laborOptions.showLine
      ? [[`Manoperă${input.laborOptions.vatRate > 0 ? ` cu TVA (${input.laborOptions.vatRate}%)` : ""}`, input.totals.laborTotal] as [string, number]]
      : []),
  ];
  summaryRows.forEach(([label, value]) => {
    page.drawText(label, { x: summaryX, y, font: regular, size: 8, color: gray });
    drawRight(page, `${formatMoney(value)} ${currencyLabel}`, summaryRight, y, bold, 8, navy);
    y -= 18;
  });
  page.drawRectangle({ x: summaryX - 8, y: y - 22, width: 233, height: 34, color: navy });
  page.drawText("TOTAL GENERAL", { x: summaryX, y: y - 10, font: bold, size: 9, color: rgb(1, 1, 1) });
  drawRight(page, `${formatMoney(input.totals.grand)} ${currencyLabel}`, summaryRight - 7, y - 12, bold, 12, yellow);
  y -= 62;

  if (input.notes.trim()) {
    if (y < 120) {
      page = pdf.addPage([595.28, 841.89]);
      drawDocumentHeader(page, true);
      y = 750;
    }
    page.drawText("CONDIȚII ȘI MENȚIUNI", { x: 40, y, font: bold, size: 8, color: navy });
    y -= 16;
    const noteLines = wrapText(input.notes, regular, 7.5, 515);
    for (const line of noteLines) {
      if (y < 55) {
        page = pdf.addPage([595.28, 841.89]);
        drawDocumentHeader(page, true);
        y = 750;
      }
      page.drawText(line || " ", { x: 40, y, font: regular, size: 7.5, color: gray });
      y -= 11;
    }
  }

  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    current.drawLine({ start: { x: 40, y: 35 }, end: { x: 555, y: 35 }, thickness: 0.5, color: light });
    current.drawText(`${input.company.name} | ${input.number}`, { x: 40, y: 20, font: regular, size: 6.5, color: gray });
    drawRight(current, `Pagina ${index + 1} din ${pages.length}`, 555, 20, regular, 6.5, gray);
  });

  const bytes = await pdf.save();
  const safeClient = (input.client || "client").replace(/[^a-zA-Z0-9ăâîșțĂÂÎȘȚ -]/g, "").trim().replace(/\s+/g, "-");
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${input.number}-${safeClient}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
