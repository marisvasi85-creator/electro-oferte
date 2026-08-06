/**
 * Compatibility facade over the Calculation Engine.
 * Existing UI that expects CableEstimate / mergeCableSettings continues to work.
 */

import { getSymbolDefinition } from "./symbols";
import {
  mergeCalculationConfig,
  runCalculationEngine,
  type CalculationResult,
} from "./calculation";
import {
  defaultMountingHeightM,
  resolveMountingHeightM,
} from "./calculation/heights";
import type {
  CableEstimate,
  CableRun,
  CableSettings,
  SymbolCategory,
  SymbolInstance,
  SymbolType,
} from "./types";

export type { CalculationResult };
export { defaultMountingHeightM, resolveMountingHeightM };

export const DEFAULT_CABLE_SETTINGS: CableSettings = {
  metersPerPixel: null,
  calibrationPixelDistance: null,
  calibrationRealDistanceM: null,
  outletHeightM: 0.4,
  switchHeightM: 1.1,
  panelHeightM: 1.5,
  lightHeightM: 2.5,
  detectorHeightM: 2.5,
  reservePercent: 10,
  routing: "floor_orthogonal",
  routingMode: "circuit_tree",
};

export function mergeCableSettings(partial?: Partial<CableSettings> | null): CableSettings {
  return {
    ...DEFAULT_CABLE_SETTINGS,
    ...(partial ?? {}),
  };
}

export function isCableConsumer(type: SymbolType): boolean {
  if (type === "tablou_electric") return false;
  const category = getSymbolDefinition(type).category;
  return category === "prize"
    || category === "intrerupatoare"
    || category === "iluminat"
    || type === "detector_fum"
    || type === "detector_gaz";
}

/** Full professional calculation — preferred API for UI and future adapters. */
export function calculateProject(
  symbols: SymbolInstance[],
  settings?: Partial<CableSettings> | null,
): CalculationResult {
  return runCalculationEngine({
    symbols,
    config: mergeCableSettings(settings),
  });
}

/**
 * Legacy cable estimate for canvas guides and older callers.
 * Built on top of the calculation engine (circuit-tree routing by default).
 */
export function estimateCable(symbols: SymbolInstance[], settings: CableSettings): CableEstimate {
  return toCableEstimate(calculateProject(symbols, settings), symbols);
}

export function toCableEstimate(result: CalculationResult, symbols: SymbolInstance[]): CableEstimate {
  const byCategory: CableEstimate["byCategory"] = {
    prize: 0,
    intrerupatoare: 0,
    iluminat: 0,
    diverse: 0,
  };

  for (const segment of result.segments) {
    byCategory[segment.category] += segment.totalM;
  }

  const runs: CableRun[] = result.visualRuns.map((run) => ({
    deviceId: run.deviceId,
    panelId: run.panelId,
    label: run.label,
    category: run.category,
    floorM: run.floorM,
    dropM: run.dropM,
    riseM: run.riseM,
    totalM: run.totalM,
  }));

  return {
    runs,
    byCategory,
    rawTotalM: result.totals.cableRawM,
    withReserveM: result.totals.cableWithReserveM,
    deviceCount: result.counts.devicesTotal || symbols.filter((s) => isCableConsumer(s.symbolType)).length,
    panelCount: result.counts.panels,
    calibrated: result.calibrated,
    missingPanel: result.missingPanel,
    routeSegments: result.segments.map((segment) => ({
      fromId: segment.fromId,
      toId: segment.toId,
    })),
  };
}

export function formatMeters(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 10) return `${value.toFixed(2)} m`;
  return `${value.toFixed(1)} m`;
}

export function metersPerPixelFromCalibration(pixelDistance: number, realDistanceM: number): number | null {
  if (!(pixelDistance > 0) || !(realDistanceM > 0)) return null;
  return realDistanceM / pixelDistance;
}

export function categoryKey(type: SymbolType): SymbolCategory {
  if (type === "detector_fum" || type === "detector_gaz") return "diverse";
  return getSymbolDefinition(type).category;
}

/** Re-export config merge used by the engine. */
export { mergeCalculationConfig };
