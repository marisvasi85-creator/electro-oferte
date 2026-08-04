import type { SymbolCategory, SymbolDefinition, SymbolType } from "./types";

export const SYMBOL_LIBRARY: SymbolDefinition[] = [
  { type: "priza_simpla", category: "prize", label: "Priză simplă", legend: "○ Priză simplă", width: 28, height: 28 },
  { type: "priza_dubla", category: "prize", label: "Priză dublă", legend: "◎ Priză dublă", width: 34, height: 28 },
  { type: "priza_ip54", category: "prize", label: "Priză IP54", legend: "□ IP54", width: 30, height: 30 },
  { type: "priza_tv", category: "prize", label: "Priză TV", legend: "TV", width: 30, height: 30 },
  { type: "priza_data", category: "prize", label: "Priză DATA", legend: "DATA", width: 34, height: 30 },
  { type: "priza_ac", category: "prize", label: "Priză AC", legend: "AC", width: 30, height: 30 },
  { type: "priza_400v", category: "prize", label: "Priză 400V", legend: "400V", width: 34, height: 30 },
  { type: "intrerupator_simplu", category: "intrerupatoare", label: "Întrerupător simplu", legend: "S1", width: 26, height: 26 },
  { type: "intrerupator_dublu", category: "intrerupatoare", label: "Întrerupător dublu", legend: "S2", width: 30, height: 26 },
  { type: "intrerupator_cap_scara", category: "intrerupatoare", label: "Cap scară", legend: "CS", width: 28, height: 26 },
  { type: "intrerupator_cruce", category: "intrerupatoare", label: "Cruce", legend: "X", width: 28, height: 28 },
  { type: "corp_iluminat", category: "iluminat", label: "Corp iluminat", legend: "Corp iluminat", width: 30, height: 30 },
  { type: "spot", category: "iluminat", label: "Spot", legend: "Spot", width: 26, height: 26 },
  { type: "aplica", category: "iluminat", label: "Aplică", legend: "Aplică", width: 30, height: 24 },
  { type: "pendul", category: "iluminat", label: "Pendul", legend: "Pendul", width: 28, height: 32 },
  { type: "led", category: "iluminat", label: "Bandă LED", legend: "LED", width: 36, height: 18 },
  { type: "detector_fum", category: "diverse", label: "Detector fum", legend: "DF", width: 28, height: 28 },
  { type: "detector_gaz", category: "diverse", label: "Detector gaz", legend: "DG", width: 28, height: 28 },
  { type: "tablou_electric", category: "diverse", label: "Tablou electric", legend: "TE", width: 36, height: 40 },
];

export const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  prize: "Prize",
  intrerupatoare: "Întrerupătoare",
  iluminat: "Iluminat",
  diverse: "Diverse",
};

export function getSymbolDefinition(type: SymbolType): SymbolDefinition {
  return SYMBOL_LIBRARY.find((item) => item.type === type) ?? SYMBOL_LIBRARY[0];
}

export function symbolsByCategory(category: SymbolCategory) {
  return SYMBOL_LIBRARY.filter((item) => item.category === category);
}
