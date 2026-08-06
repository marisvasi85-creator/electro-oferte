import { jsPDF } from "jspdf";
import type { CalculationResult } from "./calculation";
import type { PlanPage, PlanProject, SymbolInstance, SymbolType } from "./types";
import { getSymbolDefinition } from "./symbols";
import { getSymbolSvgMarkup, getSymbolSvgSize } from "./symbol-svg";

function usedLegend(symbols: SymbolInstance[]) {
  const seen = new Set<string>();
  const items: Array<{ legend: string; type: SymbolType }> = [];
  for (const symbol of symbols) {
    if (seen.has(symbol.symbolType)) continue;
    seen.add(symbol.symbolType);
    items.push({ type: symbol.symbolType, legend: getSymbolDefinition(symbol.symbolType).legend });
  }
  return items;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nu s-a putut încărca simbolul pentru legendă."));
    image.src = src;
  });
}

/** Rasterize catalog SVG glyph to PNG data URL for jsPDF. */
export async function rasterizeSymbolPng(type: SymbolType, scale = 4): Promise<string> {
  const { width, height } = getSymbolSvgSize(type);
  const markup = getSymbolSvgMarkup(type).replace(
    "<svg ",
    `<svg width="${width * scale}" height="${height * scale}" `,
  );
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponibil pentru legendă.");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function buildLegendIconMap(types: SymbolType[]): Promise<Map<SymbolType, string>> {
  const entries = await Promise.all(
    types.map(async (type) => [type, await rasterizeSymbolPng(type)] as const),
  );
  return new Map(entries);
}

function slugFileName(value: string) {
  return (value || "plan-electric").replace(/\s+/g, "-").toLowerCase();
}

type ExportStage = {
  width: () => number;
  height: () => number;
  scaleX: () => number;
  scaleY: () => number;
  x: () => number;
  y: () => number;
  size: (size: { width: number; height: number }) => unknown;
  scale: (scale: { x: number; y: number }) => unknown;
  position: (position: { x: number; y: number }) => unknown;
  batchDraw?: () => void;
  draw?: () => void;
  toDataURL: (config?: Record<string, unknown>) => string;
};

function redrawStage(stage: ExportStage) {
  if (stage.batchDraw) stage.batchDraw();
  else stage.draw?.();
}

/**
 * Capture the full plan page (not the current zoomed/panned viewport).
 * Temporarily resets stage transform, then restores the editor view.
 */
export async function captureFullPlanDataUrl(
  stage: ExportStage,
  planWidth: number,
  planHeight: number,
  options: {
    pixelRatio?: number;
    mimeType?: string;
    quality?: number;
  } = {},
): Promise<string> {
  const width = Math.max(1, Math.round(planWidth));
  const height = Math.max(1, Math.round(planHeight));
  const maxSide = Math.max(width, height);
  const autoRatio = maxSide > 4500 ? 1.25 : maxSide > 3000 ? 1.75 : maxSide > 2000 ? 2 : 2.5;
  const pixelRatio = options.pixelRatio ?? autoRatio;
  const previous = {
    width: stage.width(),
    height: stage.height(),
    scaleX: stage.scaleX(),
    scaleY: stage.scaleY(),
    x: stage.x(),
    y: stage.y(),
  };

  try {
    stage.size({ width, height });
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    redrawStage(stage);
    return stage.toDataURL({
      pixelRatio,
      mimeType: options.mimeType ?? "image/png",
      quality: options.quality,
      x: 0,
      y: 0,
      width,
      height,
    });
  } finally {
    stage.size({ width: previous.width, height: previous.height });
    stage.scale({ x: previous.scaleX, y: previous.scaleY });
    stage.position({ x: previous.x, y: previous.y });
    redrawStage(stage);
  }
}

export async function exportStageAsDataUrl(
  stage: ExportStage,
  planWidth: number,
  planHeight: number,
  pixelRatio = 2,
) {
  return captureFullPlanDataUrl(stage, planWidth, planHeight, {
    pixelRatio,
    mimeType: "image/png",
  });
}

export async function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportPlanImage(input: {
  stage: ExportStage;
  page: Pick<PlanPage, "width" | "height">;
  format: "png" | "jpeg";
  fileName: string;
}) {
  const mimeType = input.format === "png" ? "image/png" : "image/jpeg";
  const dataUrl = await captureFullPlanDataUrl(input.stage, input.page.width, input.page.height, {
    mimeType,
    quality: 0.95,
  });
  await downloadDataUrl(dataUrl, `${input.fileName}.${input.format === "png" ? "png" : "jpg"}`);
}

export async function exportPlanPdf(input: {
  stage: ExportStage;
  project: PlanProject;
  page: PlanPage;
  symbols: SymbolInstance[];
  size: "a3" | "a4";
  fileName: string;
  /** When provided, a materials BOM page is appended. */
  calculation?: CalculationResult | null;
}) {
  const dataUrl = await captureFullPlanDataUrl(input.stage, input.page.width, input.page.height, {
    pixelRatio: 2.5,
    mimeType: "image/jpeg",
    quality: 0.92,
  });
  const orientation = input.page.width >= input.page.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: input.size,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const header = 16;
  // Tiny footer — legend is on a separate page; keep almost all space for the plan.
  const footer = 4;
  const legend = usedLegend(input.symbols);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(input.project.name || "Plan electric", margin, 10);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Beneficiar: ${input.project.client || "—"}`, margin, 15);
  if (input.project.address) pdf.text(input.project.address, margin + 70, 15);

  const maxW = pageWidth - margin * 2;
  const maxH = Math.max(40, pageHeight - header - footer);
  const ratio = Math.min(maxW / input.page.width, maxH / input.page.height);
  const drawW = input.page.width * ratio;
  const drawH = input.page.height * ratio;
  const x = margin + (maxW - drawW) / 2;
  // Vertically center the full plan in the available area when letterboxed.
  const y = header + Math.max(0, (maxH - drawH) / 2);
  pdf.addImage(dataUrl, "JPEG", x, y, drawW, drawH);

  if (legend.length > 0) {
    const icons = await buildLegendIconMap(legend.map((item) => item.type));
    appendLegendPdfPage(pdf, {
      project: input.project,
      items: legend,
      icons,
      format: input.size,
      orientation,
    });
  }

  if (input.calculation && input.calculation.billOfMaterials.length > 0) {
    appendMaterialsPdfPages(pdf, {
      project: input.project,
      calculation: input.calculation,
    });
  }

  pdf.save(`${input.fileName}-${input.size}.pdf`);
}

function appendLegendPdfPage(
  pdf: jsPDF,
  input: {
    project: PlanProject;
    items: Array<{ type: SymbolType; legend: string }>;
    icons: Map<SymbolType, string>;
    format: "a3" | "a4";
    orientation: "landscape" | "portrait";
  },
) {
  const margin = 14;
  const rowH = 14;
  const iconBox = 10;
  let continuation = false;
  let pageWidth = 0;
  let pageHeight = 0;
  let cols = 2;
  let contentTop = 0;
  let rowsPerPage = 1;
  let writtenOnPage = 0;

  const openPage = () => {
    pdf.addPage(input.format, input.orientation);
    pageWidth = pdf.internal.pageSize.getWidth();
    pageHeight = pdf.internal.pageSize.getHeight();
    cols = pageWidth >= 350 ? 3 : 2;
    contentTop = continuation ? margin + 12 : margin + 24;
    rowsPerPage = Math.max(1, Math.floor((pageHeight - contentTop - margin) / rowH));
    writtenOnPage = 0;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(20);
    pdf.text(continuation ? "Legendă simboluri (continuare)" : "Legendă simboluri", margin, margin + 2);
    if (!continuation) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(input.project.name || "Plan electric", margin, margin + 9);
      pdf.text("Simbolurile de mai jos corespund celor de pe plan.", margin, margin + 15);
    }
  };

  openPage();

  for (const item of input.items) {
    if (writtenOnPage >= cols * rowsPerPage) {
      continuation = true;
      openPage();
    }

    const localCol = writtenOnPage % cols;
    const localRow = Math.floor(writtenOnPage / cols);
    const lx = margin + localCol * ((pageWidth - margin * 2) / cols);
    const ly = contentTop + localRow * rowH;
    const icon = input.icons.get(item.type);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(30);
    if (icon) {
      const size = getSymbolSvgSize(item.type);
      const aspect = size.width / Math.max(1, size.height);
      const drawH = iconBox;
      const drawW = Math.min(22, iconBox * aspect);
      pdf.addImage(icon, "PNG", lx, ly, drawW, drawH);
      pdf.text(item.legend, lx + drawW + 3, ly + drawH * 0.7);
    } else {
      pdf.text(item.legend, lx, ly + 7);
    }
    writtenOnPage += 1;
  }

  pdf.setTextColor(0);
}

/** Build CSV text for the calculation BOM (UTF-8 with BOM for Excel). */
export function buildMaterialsCsv(input: {
  project: PlanProject;
  calculation: CalculationResult;
}): string {
  const lines: string[] = [];
  lines.push(csvRow(["Proiect", input.project.name || "Plan electric"]));
  lines.push(csvRow(["Beneficiar", input.project.client || ""]));
  lines.push(csvRow(["Adresa", input.project.address || ""]));
  lines.push(csvRow(["Rezerva cablu (%)", String(input.calculation.reservePercent)]));
  lines.push(csvRow(["Cablu brut (m)", formatQty(input.calculation.totals.cableRawM)]));
  lines.push(csvRow(["Cablu cu rezerva (m)", formatQty(input.calculation.totals.cableWithReserveM)]));
  lines.push("");
  lines.push(csvRow(["Grup", "Cod tehnic", "Descriere", "UM", "Cantitate"]));
  for (const line of input.calculation.billOfMaterials) {
    lines.push(csvRow([
      groupLabel(line.group),
      line.technicalKey,
      line.description,
      line.unit,
      formatQty(line.quantity),
    ]));
  }
  lines.push("");
  lines.push(csvRow(["Rezumat", "Valoare"]));
  lines.push(csvRow(["Prize", String(input.calculation.counts.sockets)]));
  lines.push(csvRow(["Intrerupatoare", String(input.calculation.counts.switches)]));
  lines.push(csvRow(["Corpuri iluminat", String(input.calculation.counts.lights)]));
  lines.push(csvRow(["Doze aparat", String(input.calculation.deviceBoxes)]));
  lines.push(csvRow(["Rame", String(input.calculation.frames.reduce((s, i) => s + i.quantity, 0))]));
  lines.push(csvRow([
    "Accesorii",
    String(input.calculation.accessories.reduce((s, i) => s + i.quantity, 0)),
  ]));
  // BOM Excel-friendly UTF-8
  return `\uFEFF${lines.join("\n")}`;
}

export async function exportMaterialsCsv(input: {
  project: PlanProject;
  calculation: CalculationResult;
  fileName?: string;
}) {
  const csv = buildMaterialsCsv(input);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${slugFileName(input.fileName || input.project.name)}-deviz.csv`);
}

export async function exportMaterialsPdf(input: {
  project: PlanProject;
  calculation: CalculationResult;
  fileName?: string;
}) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  appendMaterialsPdfPages(pdf, {
    project: input.project,
    calculation: input.calculation,
    isFirstPage: true,
  });
  pdf.save(`${slugFileName(input.fileName || input.project.name)}-deviz.pdf`);
}

function appendMaterialsPdfPages(
  pdf: jsPDF,
  input: {
    project: PlanProject;
    calculation: CalculationResult;
    isFirstPage?: boolean;
  },
) {
  const margin = 12;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottom = pageHeight - 12;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed <= bottom) return;
    pdf.addPage("a4", "portrait");
    y = margin;
    drawMaterialsHeader(pdf, input.project, margin, true);
    y = margin + 22;
  };

  if (!input.isFirstPage) {
    pdf.addPage("a4", "portrait");
  }
  drawMaterialsHeader(pdf, input.project, margin, Boolean(input.isFirstPage));
  y = margin + 22;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Rezervă cablu: ${input.calculation.reservePercent}%  ·  Cablu brut: ${formatQty(input.calculation.totals.cableRawM)} m  ·  Cu rezervă: ${formatQty(input.calculation.totals.cableWithReserveM)} m`,
    margin,
    y,
  );
  y += 6;
  pdf.text(
    `Prize: ${input.calculation.counts.sockets}  ·  Întrerupătoare: ${input.calculation.counts.switches}  ·  Iluminat: ${input.calculation.counts.lights}  ·  Doze: ${input.calculation.deviceBoxes}`,
    margin,
    y,
  );
  y += 10;

  // Table header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Grup", margin, y);
  pdf.text("Descriere", margin + 22, y);
  pdf.text("UM", pageWidth - margin - 28, y);
  pdf.text("Cant.", pageWidth - margin - 12, y, { align: "right" });
  y += 2;
  pdf.setDrawColor(180);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;
  pdf.setFont("helvetica", "normal");

  for (const line of input.calculation.billOfMaterials) {
    ensureSpace(6);
    const desc = pdf.splitTextToSize(line.description, pageWidth - margin - 60) as string[];
    pdf.text(groupLabel(line.group), margin, y);
    pdf.text(desc[0] || line.description, margin + 22, y);
    pdf.text(line.unit, pageWidth - margin - 28, y);
    pdf.text(formatQty(line.quantity), pageWidth - margin - 12, y, { align: "right" });
    y += 5;
    for (let i = 1; i < desc.length; i += 1) {
      ensureSpace(5);
      pdf.text(desc[i], margin + 22, y);
      y += 4;
    }
  }

  if (input.calculation.circuits.length) {
    y += 6;
    ensureSpace(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Circuite", margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    for (const circuit of input.calculation.circuits) {
      ensureSpace(5);
      pdf.text(
        `${circuit.name}: ${circuit.deviceCount} aparate · ${formatQty(circuit.lengthWithReserveM)} m cablu (cu rezervă)`,
        margin,
        y,
      );
      y += 5;
    }
  }
}

function drawMaterialsHeader(pdf: jsPDF, project: PlanProject, margin: number, showTitle: boolean) {
  if (!showTitle) return;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Deviz materiale — Plan electric", margin, margin + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(project.name || "Plan electric", margin, margin + 10);
  pdf.text(`Beneficiar: ${project.client || "—"}`, margin, margin + 15);
  if (project.address) {
    pdf.text(project.address, margin, margin + 20);
  }
}

function groupLabel(group: string): string {
  if (group === "cable") return "Cablu";
  if (group === "device") return "Aparat";
  if (group === "box") return "Doză";
  if (group === "frame") return "Ramă";
  return "Accesoriu";
}

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function csvRow(cells: string[]): string {
  return cells.map(escapeCsv).join(",");
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
