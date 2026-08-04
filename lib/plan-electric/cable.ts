import { getSymbolDefinition } from "./symbols";
import type { CableEstimate, CableRun, CableSettings, SymbolInstance, SymbolType } from "./types";

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

export function defaultMountingHeightM(type: SymbolType, settings: CableSettings): number {
  if (type === "tablou_electric") return settings.panelHeightM;
  const category = getSymbolDefinition(type).category;
  if (category === "prize") return settings.outletHeightM;
  if (category === "intrerupatoare") return settings.switchHeightM;
  if (category === "iluminat") return settings.lightHeightM;
  if (type === "detector_fum" || type === "detector_gaz") return settings.detectorHeightM;
  return settings.outletHeightM;
}

export function resolveMountingHeightM(symbol: SymbolInstance, settings: CableSettings): number {
  const override = symbol.metadata?.mountingHeightM;
  if (typeof override === "number" && Number.isFinite(override) && override >= 0) {
    return override;
  }
  return defaultMountingHeightM(symbol.symbolType, settings);
}

function horizontalMeters(
  from: { x: number; y: number },
  to: { x: number; y: number },
  metersPerPixel: number,
  routing: CableSettings["routing"],
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const pixels = routing === "floor_euclidean" ? Math.hypot(dx, dy) : dx + dy;
  return pixels * metersPerPixel;
}

function categoryKey(type: SymbolType): keyof CableEstimate["byCategory"] {
  if (type === "detector_fum" || type === "detector_gaz") return "diverse";
  return getSymbolDefinition(type).category;
}

/**
 * Floor cabling model:
 * drop from panel to floor + orthogonal/euclidean floor run + rise to device height.
 * L = H_panel + L_floor + H_device
 */
export function estimateCable(symbols: SymbolInstance[], settings: CableSettings): CableEstimate {
  const panels = symbols.filter((symbol) => symbol.symbolType === "tablou_electric");
  const consumers = symbols.filter((symbol) => isCableConsumer(symbol.symbolType));
  const byCategory: CableEstimate["byCategory"] = {
    prize: 0,
    intrerupatoare: 0,
    iluminat: 0,
    diverse: 0,
  };

  if (!settings.metersPerPixel || settings.metersPerPixel <= 0) {
    return {
      runs: [],
      byCategory,
      rawTotalM: 0,
      withReserveM: 0,
      deviceCount: consumers.length,
      panelCount: panels.length,
      calibrated: false,
      missingPanel: true,
    };
  }

  if (!panels.length) {
    return {
      runs: [],
      byCategory,
      rawTotalM: 0,
      withReserveM: 0,
      deviceCount: consumers.length,
      panelCount: 0,
      calibrated: true,
      missingPanel: true,
    };
  }

  const runs: CableRun[] = consumers.map((device) => {
    const panel = panels.reduce((best, candidate) => {
      const bestDist = Math.hypot(best.x - device.x, best.y - device.y);
      const nextDist = Math.hypot(candidate.x - device.x, candidate.y - device.y);
      return nextDist < bestDist ? candidate : best;
    });
    const deviceHeight = resolveMountingHeightM(device, settings);
    const panelHeight = resolveMountingHeightM(panel, settings);
    const floorM = horizontalMeters(panel, device, settings.metersPerPixel!, settings.routing);
    const dropM = Math.max(0, panelHeight);
    const riseM = Math.max(0, deviceHeight);
    const totalM = dropM + floorM + riseM;
    const category = categoryKey(device.symbolType);
    byCategory[category] += totalM;
    return {
      deviceId: device.id,
      panelId: panel.id,
      label: device.label || getSymbolDefinition(device.symbolType).label,
      category,
      floorM,
      dropM,
      riseM,
      totalM,
    };
  });

  const rawTotalM = runs.reduce((sum, run) => sum + run.totalM, 0);
  const withReserveM = rawTotalM * (1 + Math.max(0, settings.reservePercent) / 100);

  return {
    runs,
    byCategory,
    rawTotalM,
    withReserveM,
    deviceCount: consumers.length,
    panelCount: panels.length,
    calibrated: true,
    missingPanel: false,
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
