import { DEFAULT_MATERIAL_CATALOG } from "../catalog";
import type { ProjectMaterialCatalog } from "../catalog/types";
import type { CableSettings, SymbolInstance } from "../types";
import { cableRoutesRule } from "./rules/cables";
import { devicesRule } from "./rules/devices";
import type {
  AccessoryTotal,
  CalculationConfig,
  CalculationResult,
  CalculationRule,
  CableTypeTotal,
  CircuitSummary,
  MaterialLine,
  RouteSegment,
} from "./types";

const CORE_RULES: CalculationRule[] = [
  cableRoutesRule,
  devicesRule,
];

/** Registry for future rules (I7 checks, voltage drop, breakers, labor, etc.). */
const extraRules: CalculationRule[] = [];

export function registerCalculationRule(rule: CalculationRule) {
  if (extraRules.some((entry) => entry.id === rule.id)) return;
  extraRules.push(rule);
}

export function mergeCalculationConfig(partial?: Partial<CalculationConfig> | Partial<CableSettings> | null): CalculationConfig {
  const base: CalculationConfig = {
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
    schemaVersion: 1,
  };
  return {
    ...base,
    ...(partial ?? {}),
    routingMode: partial?.routingMode ?? base.routingMode,
    schemaVersion: (partial as Partial<CalculationConfig> | null | undefined)?.schemaVersion ?? base.schemaVersion,
  };
}

export function runCalculationEngine(input: {
  symbols: SymbolInstance[];
  config?: Partial<CalculationConfig> | Partial<CableSettings> | null;
  catalog?: ProjectMaterialCatalog;
  rules?: CalculationRule[];
}): CalculationResult {
  const config = mergeCalculationConfig(input.config);
  const catalog = input.catalog ?? DEFAULT_MATERIAL_CATALOG;
  const rules = input.rules ?? [...CORE_RULES, ...extraRules];
  const ctx = { symbols: input.symbols, config, catalog };

  const segments: RouteSegment[] = [];
  const diagnostics: string[] = [];
  const deviceTotals: CalculationResult["devices"] = [];
  const accessories: AccessoryTotal[] = [];

  for (const rule of [...rules].sort((a, b) => a.id.localeCompare(b.id))) {
    const contribution = rule.apply(ctx);
    if (contribution.segments) segments.push(...contribution.segments);
    if (contribution.diagnostics) diagnostics.push(...contribution.diagnostics);
    if (contribution.deviceTotals) deviceTotals.push(...contribution.deviceTotals);
    if (contribution.accessories) accessories.push(...contribution.accessories);
  }

  const mergedDevices = mergeDeviceTotals(deviceTotals);
  const mergedAccessories = mergeAccessories(accessories);
  const reserve = Math.max(0, config.reservePercent) / 100;
  const cables = aggregateCables(segments, catalog, reserve);
  const circuits = aggregateCircuits(segments, reserve);
  const counts = countDevices(mergedDevices);
  const frames = mergedAccessories.filter((item) => item.technicalKey.startsWith("frame."));
  const nonFrameAccessories = mergedAccessories.filter(
    (item) => !item.technicalKey.startsWith("frame.") && item.technicalKey !== "accessory.device_box",
  );
  const deviceBoxes = mergedDevices.reduce((sum, item) => sum + item.deviceBoxes, 0);
  const cableRawM = cables.reduce((sum, item) => sum + item.lengthRawM, 0);
  const cableWithReserveM = cables.reduce((sum, item) => sum + item.lengthWithReserveM, 0);

  const panels = input.symbols.filter((symbol) => symbol.symbolType === "tablou_electric").length;
  const calibrated = Boolean(config.metersPerPixel && config.metersPerPixel > 0);

  return {
    schemaVersion: config.schemaVersion,
    calibrated,
    missingPanel: panels === 0,
    reservePercent: config.reservePercent,
    segments,
    cables,
    devices: mergedDevices,
    circuits,
    deviceBoxes,
    frames,
    accessories: nonFrameAccessories,
    counts: { ...counts, panels },
    totals: { cableRawM, cableWithReserveM },
    billOfMaterials: buildBom({
      cables,
      deviceTotals: mergedDevices,
      frames,
      accessories: nonFrameAccessories,
      deviceBoxes,
    }),
    diagnostics,
    visualRuns: buildVisualRuns(segments),
  };
}

function mergeDeviceTotals(items: CalculationResult["devices"]): CalculationResult["devices"] {
  const map = new Map<string, CalculationResult["devices"][number]>();
  for (const item of items) {
    const current = map.get(item.symbolType);
    if (!current) {
      map.set(item.symbolType, { ...item });
      continue;
    }
    current.count += item.count;
    current.deviceBoxes += item.deviceBoxes;
    current.frames += item.frames;
    current.extraConductors += item.extraConductors;
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ro"));
}

function mergeAccessories(items: AccessoryTotal[]): AccessoryTotal[] {
  const map = new Map<string, AccessoryTotal>();
  for (const item of items) {
    const current = map.get(item.technicalKey);
    if (!current) {
      map.set(item.technicalKey, { ...item });
      continue;
    }
    current.quantity += item.quantity;
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ro"));
}

function aggregateCables(
  segments: RouteSegment[],
  catalog: ProjectMaterialCatalog,
  reserve: number,
): CableTypeTotal[] {
  const map = new Map<string, CableTypeTotal>();
  for (const segment of segments) {
    const article = catalog.cables[segment.cableType];
    const current = map.get(segment.cableType) ?? {
      technicalKey: segment.cableType,
      label: article?.label ?? segment.cableType,
      lengthRawM: 0,
      lengthWithReserveM: 0,
      segmentCount: 0,
    };
    current.lengthRawM += segment.totalM;
    current.segmentCount += 1;
    map.set(segment.cableType, current);
  }
  return [...map.values()]
    .map((item) => ({
      ...item,
      lengthWithReserveM: item.lengthRawM * (1 + reserve),
    }))
    .sort((a, b) => b.lengthRawM - a.lengthRawM);
}

function aggregateCircuits(segments: RouteSegment[], reserve: number): CircuitSummary[] {
  const map = new Map<string, CircuitSummary & { devices: Set<string> }>();
  for (const segment of segments) {
    const current = map.get(segment.circuit) ?? {
      name: segment.circuit,
      cableType: segment.cableType,
      deviceCount: 0,
      lengthRawM: 0,
      lengthWithReserveM: 0,
      devices: new Set<string>(),
    };
    current.lengthRawM += segment.totalM;
    current.devices.add(segment.deviceId);
    map.set(segment.circuit, current);
  }
  return [...map.values()].map((item) => ({
    name: item.name,
    cableType: item.cableType,
    deviceCount: item.devices.size,
    lengthRawM: item.lengthRawM,
    lengthWithReserveM: item.lengthRawM * (1 + reserve),
  }));
}

function countDevices(deviceTotals: CalculationResult["devices"]) {
  return {
    sockets: deviceTotals.filter((item) => item.category === "socket").reduce((sum, item) => sum + item.count, 0),
    switches: deviceTotals.filter((item) => item.category === "switch").reduce((sum, item) => sum + item.count, 0),
    lights: deviceTotals.filter((item) => item.category === "light").reduce((sum, item) => sum + item.count, 0),
    detectors: deviceTotals.filter((item) => item.category === "detector").reduce((sum, item) => sum + item.count, 0),
    devicesTotal: deviceTotals.reduce((sum, item) => sum + item.count, 0),
  };
}

function buildBom(input: {
  cables: CableTypeTotal[];
  deviceTotals: CalculationResult["devices"];
  frames: AccessoryTotal[];
  accessories: AccessoryTotal[];
  deviceBoxes: number;
}): MaterialLine[] {
  const lines: MaterialLine[] = [];

  for (const cable of input.cables) {
    lines.push({
      technicalKey: cable.technicalKey,
      description: cable.label,
      unit: "m",
      quantity: Number(cable.lengthWithReserveM.toFixed(2)),
      group: "cable",
    });
  }

  for (const device of input.deviceTotals) {
    lines.push({
      technicalKey: `device.${device.symbolType}`,
      description: device.label,
      unit: "buc",
      quantity: device.count,
      group: "device",
    });
  }

  if (input.deviceBoxes > 0) {
    lines.push({
      technicalKey: "accessory.device_box",
      description: "Doză aparat",
      unit: "buc",
      quantity: input.deviceBoxes,
      group: "box",
    });
  }

  for (const frame of input.frames) {
    lines.push({
      technicalKey: frame.technicalKey,
      description: frame.label,
      unit: frame.unit,
      quantity: frame.quantity,
      group: "frame",
    });
  }

  for (const accessory of input.accessories) {
    if (accessory.technicalKey === "accessory.device_box") continue; // already from deviceBoxes
    lines.push({
      technicalKey: accessory.technicalKey,
      description: accessory.label,
      unit: accessory.unit,
      quantity: accessory.quantity,
      group: "accessory",
    });
  }

  return lines;
}

function buildVisualRuns(segments: RouteSegment[]) {
  // One guide per consumer device: aggregate floor length of edges ending at that device,
  // using the panel id from the segment for canvas drawing (panel → device polyline).
  const byDevice = new Map<string, RouteSegment>();
  for (const segment of segments) {
    if (!byDevice.has(segment.deviceId)) byDevice.set(segment.deviceId, segment);
  }
  return [...byDevice.values()].map((segment) => ({
    deviceId: segment.deviceId,
    panelId: segment.panelId,
    label: segment.toLabel,
    category: segment.category,
    floorM: segment.floorM,
    dropM: segment.dropM,
    riseM: segment.riseM,
    totalM: segment.totalM,
  }));
}
