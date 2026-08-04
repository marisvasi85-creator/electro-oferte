import type { SymbolCategory, SymbolDefinition, SymbolType } from "./types";

/**
 * Library labels follow Romanian installation drawing practice
 * (SR EN 60617 / planuri de amplasament).
 */
export const SYMBOL_LIBRARY: SymbolDefinition[] = [
  { type: "priza_simpla", category: "prize", label: "Priză 2P+T", legend: "Priză 2P+T", width: 30, height: 30 },
  { type: "priza_dubla", category: "prize", label: "Priză dublă 2P+T", legend: "Priză dublă", width: 40, height: 30 },
  { type: "priza_ip54", category: "prize", label: "Priză IP54", legend: "Priză IP54", width: 32, height: 32 },
  { type: "priza_tv", category: "prize", label: "Priză TV", legend: "Priză TV", width: 30, height: 30 },
  { type: "priza_data", category: "prize", label: "Priză date (RJ45)", legend: "Priză date", width: 32, height: 30 },
  { type: "priza_ac", category: "prize", label: "Priză AC", legend: "Priză AC", width: 30, height: 30 },
  { type: "priza_400v", category: "prize", label: "Priză trifazată 400V", legend: "Priză 400V", width: 34, height: 32 },
  { type: "intrerupator_simplu", category: "intrerupatoare", label: "Întrerupător unipolar", legend: "Într. unipolar", width: 28, height: 28 },
  { type: "intrerupator_dublu", category: "intrerupatoare", label: "Întrerupător bipolar", legend: "Într. bipolar", width: 30, height: 28 },
  { type: "intrerupator_cap_scara", category: "intrerupatoare", label: "Comutator cap-scară", legend: "Cap-scară", width: 30, height: 28 },
  { type: "intrerupator_cruce", category: "intrerupatoare", label: "Comutator cruce", legend: "Cruce", width: 30, height: 30 },
  { type: "corp_iluminat", category: "iluminat", label: "Corp iluminat", legend: "Corp iluminat", width: 30, height: 30 },
  { type: "spot", category: "iluminat", label: "Spot / coborât", legend: "Spot", width: 28, height: 28 },
  { type: "aplica", category: "iluminat", label: "Aplică perete", legend: "Aplică", width: 30, height: 26 },
  { type: "pendul", category: "iluminat", label: "Pendul", legend: "Pendul", width: 28, height: 34 },
  { type: "led", category: "iluminat", label: "Bandă LED", legend: "Bandă LED", width: 38, height: 18 },
  { type: "detector_fum", category: "diverse", label: "Detector de fum", legend: "Det. fum", width: 30, height: 30 },
  { type: "detector_gaz", category: "diverse", label: "Detector de gaz", legend: "Det. gaz", width: 30, height: 30 },
  { type: "tablou_electric", category: "diverse", label: "Tablou electric", legend: "Tablou TE", width: 36, height: 40 },
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
