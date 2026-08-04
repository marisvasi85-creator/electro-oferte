import type { SymbolCategory, SymbolDefinition, SymbolType } from "./types";

/** Color coding for plan readability. */
export const SYMBOL_COLORS = {
  outlet: "#dc2626",
  switch: "#2563eb",
  fixtureGreen: "#16a34a",
  panel: "#dc2626",
  led: "#eab308",
  ledBulb: "#facc15",
  default: "#0f172a",
} as const;

export const DEFAULT_LED_LENGTH_PX = 120;
export const MIN_LED_LENGTH_PX = 40;
export const MAX_LED_LENGTH_PX = 4000;

/**
 * Library labels follow Romanian installation drawing practice
 * (SR EN 60617 / planuri de amplasament).
 * Sizes are kept compact so symbols sit correctly on architectural plans.
 */
export const SYMBOL_LIBRARY: SymbolDefinition[] = [
  { type: "priza_simpla", category: "prize", label: "Priză simplă", legend: "Priză simplă", width: 16, height: 16 },
  { type: "priza_dubla", category: "prize", label: "Priză dublă", legend: "Priză dublă", width: 24, height: 16 },
  { type: "priza_tripla", category: "prize", label: "Priză triplă", legend: "Priză triplă", width: 34, height: 16 },
  { type: "priza_ip54", category: "prize", label: "Priză IP54", legend: "Priză IP54", width: 18, height: 18 },
  { type: "priza_tv", category: "prize", label: "Priză TV", legend: "Priză TV", width: 16, height: 16 },
  { type: "priza_data", category: "prize", label: "Priză date (RJ45)", legend: "Priză date", width: 16, height: 16 },
  { type: "priza_ac", category: "prize", label: "Priză AC", legend: "Priză AC", width: 16, height: 16 },
  { type: "priza_400v", category: "prize", label: "Priză trifazată 400V", legend: "Priză 400V", width: 18, height: 18 },
  { type: "intrerupator_simplu", category: "intrerupatoare", label: "Simplu", legend: "Într. simplu", width: 14, height: 14 },
  { type: "intrerupator_dublu", category: "intrerupatoare", label: "Dublu", legend: "Într. dublu", width: 24, height: 14 },
  { type: "intrerupator_triplu", category: "intrerupatoare", label: "Triplu", legend: "Într. triplu", width: 34, height: 14 },
  { type: "intrerupator_cap_scara", category: "intrerupatoare", label: "Simplu c.s.", legend: "Simplu c.s.", width: 14, height: 14 },
  { type: "intrerupator_dublu_cs", category: "intrerupatoare", label: "Dublu c.s.", legend: "Dublu c.s.", width: 24, height: 14 },
  { type: "intrerupator_triplu_cs", category: "intrerupatoare", label: "Triplu c.s.", legend: "Triplu c.s.", width: 34, height: 14 },
  { type: "intrerupator_cruce", category: "intrerupatoare", label: "Simplu cruce", legend: "Simplu cruce", width: 14, height: 14 },
  { type: "intrerupator_dublu_cruce", category: "intrerupatoare", label: "Dublu cruce", legend: "Dublu cruce", width: 24, height: 14 },
  { type: "intrerupator_triplu_cruce", category: "intrerupatoare", label: "Triplu cruce", legend: "Triplu cruce", width: 34, height: 14 },
  { type: "corp_iluminat", category: "iluminat", label: "Corp iluminat", legend: "Corp iluminat", width: 16, height: 16 },
  { type: "spot", category: "iluminat", label: "Spot / coborât", legend: "Spot", width: 14, height: 14 },
  { type: "aplica", category: "iluminat", label: "Aplică perete", legend: "Aplică", width: 16, height: 14 },
  { type: "pendul", category: "iluminat", label: "Pendul", legend: "Pendul", width: 14, height: 18 },
  { type: "led", category: "iluminat", label: "Bandă LED", legend: "Bandă LED", width: 22, height: 10 },
  { type: "detector_fum", category: "diverse", label: "Detector de fum", legend: "Det. fum", width: 16, height: 16 },
  { type: "detector_gaz", category: "diverse", label: "Detector de gaz", legend: "Det. gaz", width: 16, height: 16 },
  { type: "tablou_electric", category: "diverse", label: "Tablou electric", legend: "Tablou TE", width: 20, height: 22 },
];

/** Default visual scale when placing a new symbol on the plan. */
export const DEFAULT_SYMBOL_SCALE = 1;

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

export function resolveLedLengthPx(metadata: Record<string, unknown> | undefined): number {
  const value = metadata?.ledLengthPx;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(MAX_LED_LENGTH_PX, Math.max(MIN_LED_LENGTH_PX, value));
  }
  return DEFAULT_LED_LENGTH_PX;
}

export function clampLedLengthPx(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LED_LENGTH_PX;
  return Math.min(MAX_LED_LENGTH_PX, Math.max(MIN_LED_LENGTH_PX, Math.round(value)));
}
