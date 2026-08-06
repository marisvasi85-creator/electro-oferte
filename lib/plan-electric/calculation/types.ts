import type { ProjectMaterialCatalog } from "../catalog/types";
import type { CableSettings, SymbolCategory, SymbolInstance } from "../types";

export type RoutingMode = "circuit_tree" | "home_run";

export type CalculationConfig = CableSettings & {
  /** How cable routes are built. Default: circuit_tree (nearest-neighbor spanning tree). */
  routingMode: RoutingMode;
  /** Schema version for future migrations. */
  schemaVersion: number;
};

export type CalculationContext = {
  symbols: SymbolInstance[];
  config: CalculationConfig;
  catalog: ProjectMaterialCatalog;
};

export type RouteSegment = {
  id: string;
  circuit: string;
  cableType: string;
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  floorM: number;
  dropM: number;
  riseM: number;
  totalM: number;
  /** Device that receives the rise (consumer end). */
  deviceId: string;
  panelId: string;
  category: SymbolCategory;
};

export type CableTypeTotal = {
  technicalKey: string;
  label: string;
  lengthRawM: number;
  lengthWithReserveM: number;
  segmentCount: number;
};

export type DeviceTypeTotal = {
  symbolType: string;
  label: string;
  category: string;
  count: number;
  deviceBoxes: number;
  frames: number;
  frameKey: string | null;
  cableType: string;
  circuit: string;
  switchKind?: string;
  extraConductors: number;
};

export type AccessoryTotal = {
  technicalKey: string;
  label: string;
  unit: "buc" | "m" | "set";
  quantity: number;
};

export type CircuitSummary = {
  name: string;
  cableType: string;
  deviceCount: number;
  lengthRawM: number;
  lengthWithReserveM: number;
};

export type MaterialLine = {
  technicalKey: string;
  description: string;
  unit: "buc" | "m" | "set";
  quantity: number;
  group: "cable" | "device" | "box" | "frame" | "accessory";
};

/**
 * Contribution from one calculation rule.
 * Rules never mutate each other — the engine merges contributions.
 */
export type CalculationContribution = {
  segments?: RouteSegment[];
  deviceTotals?: DeviceTypeTotal[];
  accessories?: AccessoryTotal[];
  diagnostics?: string[];
};

export type CalculationRule = {
  id: string;
  name: string;
  apply: (ctx: CalculationContext) => CalculationContribution;
};

export type CalculationResult = {
  schemaVersion: number;
  calibrated: boolean;
  missingPanel: boolean;
  reservePercent: number;
  segments: RouteSegment[];
  cables: CableTypeTotal[];
  devices: DeviceTypeTotal[];
  circuits: CircuitSummary[];
  deviceBoxes: number;
  frames: AccessoryTotal[];
  accessories: AccessoryTotal[];
  counts: {
    sockets: number;
    switches: number;
    lights: number;
    detectors: number;
    panels: number;
    devicesTotal: number;
  };
  totals: {
    cableRawM: number;
    cableWithReserveM: number;
  };
  /** Flat BOM ready for future offer/export adapters. */
  billOfMaterials: MaterialLine[];
  diagnostics: string[];
  /** Compatibility projection for canvas guides (one visual run per consumer). */
  visualRuns: Array<{
    deviceId: string;
    panelId: string;
    label: string;
    category: SymbolCategory;
    floorM: number;
    dropM: number;
    riseM: number;
    totalM: number;
  }>;
};
