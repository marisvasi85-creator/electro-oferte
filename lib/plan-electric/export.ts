import { jsPDF } from "jspdf";
import type { PlanPage, PlanProject, SymbolInstance } from "./types";
import { getSymbolDefinition } from "./symbols";

function usedLegend(symbols: SymbolInstance[]) {
  const seen = new Set<string>();
  const items: Array<{ legend: string; type: string }> = [];
  for (const symbol of symbols) {
    if (seen.has(symbol.symbolType)) continue;
    seen.add(symbol.symbolType);
    items.push({ type: symbol.symbolType, legend: getSymbolDefinition(symbol.symbolType).legend });
  }
  return items;
}

export async function exportStageAsDataUrl(
  stage: { toDataURL: (config?: Record<string, unknown>) => string },
  pixelRatio = 2,
) {
  return stage.toDataURL({ pixelRatio, mimeType: "image/png" });
}

export async function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export async function exportPlanImage(input: {
  stage: { toDataURL: (config?: Record<string, unknown>) => string };
  format: "png" | "jpeg";
  fileName: string;
}) {
  const mimeType = input.format === "png" ? "image/png" : "image/jpeg";
  const dataUrl = input.stage.toDataURL({ pixelRatio: 2.5, mimeType, quality: 0.95 });
  await downloadDataUrl(dataUrl, `${input.fileName}.${input.format === "png" ? "png" : "jpg"}`);
}

export async function exportPlanPdf(input: {
  stage: { toDataURL: (config?: Record<string, unknown>) => string };
  project: PlanProject;
  page: PlanPage;
  symbols: SymbolInstance[];
  size: "a3" | "a4";
  fileName: string;
}) {
  const dataUrl = input.stage.toDataURL({ pixelRatio: 2.5, mimeType: "image/jpeg", quality: 0.92 });
  const pdf = new jsPDF({
    orientation: input.page.width >= input.page.height ? "landscape" : "portrait",
    unit: "mm",
    format: input.size,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const header = 16;
  const footer = 28;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(input.project.name || "Plan electric", margin, 10);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Beneficiar: ${input.project.client || "—"}`, margin, 15);
  if (input.project.address) pdf.text(input.project.address, margin + 70, 15);

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - header - footer;
  const ratio = Math.min(maxW / input.page.width, maxH / input.page.height);
  const drawW = input.page.width * ratio;
  const drawH = input.page.height * ratio;
  const x = margin + (maxW - drawW) / 2;
  const y = header + 2;
  pdf.addImage(dataUrl, "JPEG", x, y, drawW, drawH);

  const legend = usedLegend(input.symbols);
  pdf.setFontSize(8);
  pdf.text("Legendă", margin, pageHeight - footer + 6);
  let lx = margin;
  let ly = pageHeight - footer + 11;
  legend.forEach((item, index) => {
    pdf.text(item.legend, lx, ly);
    lx += 45;
    if ((index + 1) % 4 === 0) {
      lx = margin;
      ly += 4;
    }
  });

  pdf.save(`${input.fileName}-${input.size}.pdf`);
}
