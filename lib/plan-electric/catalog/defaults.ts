import type { SymbolType } from "../types";
import type { ProjectMaterialCatalog, SymbolCatalogEntry } from "./types";

const CABLE_3X15 = "cable.n2xh.3x1.5";
const CABLE_3X25 = "cable.n2xh.3x2.5";
const CABLE_5X25 = "cable.n2xh.5x2.5";
const FRAME_1M = "frame.1m";
const FRAME_2M = "frame.2m";
const FRAME_3M = "frame.3m";

function socket(
  symbolType: SymbolType,
  deviceBoxes: number,
  modules: number,
  frame: string,
  extras: Partial<SymbolCatalogEntry> = {},
): SymbolCatalogEntry {
  return {
    symbolType,
    category: "socket",
    cableType: CABLE_3X25,
    circuit: "Prize",
    deviceBoxes,
    modules,
    frame,
    accessoryItems: [],
    ...extras,
  };
}

function sw(
  symbolType: SymbolType,
  switchKind: NonNullable<SymbolCatalogEntry["switchKind"]>,
  modules: number,
  frame: string,
  extraConductors = 0,
): SymbolCatalogEntry {
  return {
    symbolType,
    category: "switch",
    cableType: CABLE_3X15,
    circuit: "Iluminat",
    deviceBoxes: 1,
    modules,
    frame,
    switchKind,
    extraConductors,
    accessoryItems: [],
  };
}

function light(symbolType: SymbolType, extras: Partial<SymbolCatalogEntry> = {}): SymbolCatalogEntry {
  return {
    symbolType,
    category: "light",
    cableType: CABLE_3X15,
    circuit: "Iluminat",
    deviceBoxes: 0,
    modules: 0,
    frame: null,
    accessoryItems: [
      { technicalKey: "accessory.wago_3", description: "Conector tip WAGO 3 poli", unit: "buc", quantity: 1 },
    ],
    ...extras,
  };
}

const SYMBOL_ENTRIES: SymbolCatalogEntry[] = [
  socket("priza_simpla", 1, 1, FRAME_1M),
  socket("priza_dubla", 2, 2, FRAME_2M),
  socket("priza_tripla", 3, 3, FRAME_3M),
  socket("priza_ip54", 1, 1, FRAME_1M, {
    accessoryItems: [
      { technicalKey: "accessory.ip_gasket", description: "Garnitură IP", unit: "buc", quantity: 1 },
    ],
  }),
  socket("priza_tv", 1, 1, FRAME_1M),
  socket("priza_data", 1, 1, FRAME_1M, {
    cableType: "cable.data.utp",
    circuit: "Date",
  }),
  socket("priza_ac", 1, 1, FRAME_1M, {
    cableType: CABLE_3X25,
    circuit: "Prize dedicate",
  }),
  socket("priza_400v", 1, 1, FRAME_1M, {
    cableType: CABLE_5X25,
    circuit: "Prize trifazate",
  }),

  sw("intrerupator_simplu", "simple", 1, FRAME_1M),
  sw("intrerupator_dublu", "double", 2, FRAME_2M),
  sw("intrerupator_triplu", "triple", 3, FRAME_3M),
  sw("intrerupator_cap_scara", "staircase", 1, FRAME_1M, 1),
  sw("intrerupator_dublu_cs", "double_staircase", 2, FRAME_2M, 2),
  sw("intrerupator_triplu_cs", "triple_staircase", 3, FRAME_3M, 3),
  sw("intrerupator_cruce", "cross", 1, FRAME_1M, 2),
  sw("intrerupator_dublu_cruce", "double_cross", 2, FRAME_2M, 4),
  sw("intrerupator_triplu_cruce", "triple_cross", 3, FRAME_3M, 6),

  light("corp_iluminat"),
  light("spot"),
  light("aplica"),
  light("pendul"),
  light("led", {
    accessoryItems: [
      { technicalKey: "accessory.wago_3", description: "Conector tip WAGO 3 poli", unit: "buc", quantity: 1 },
      { technicalKey: "accessory.led_clip", description: "Clemă bandă LED", unit: "buc", quantity: 4 },
    ],
  }),

  {
    symbolType: "detector_fum",
    category: "detector",
    cableType: CABLE_3X15,
    circuit: "Detecție",
    deviceBoxes: 0,
    modules: 0,
    frame: null,
    accessoryItems: [],
  },
  {
    symbolType: "detector_gaz",
    category: "detector",
    cableType: CABLE_3X15,
    circuit: "Detecție",
    deviceBoxes: 0,
    modules: 0,
    frame: null,
    accessoryItems: [],
  },
  {
    symbolType: "tablou_electric",
    category: "panel",
    cableType: CABLE_3X25,
    circuit: "Alimentare",
    deviceBoxes: 0,
    modules: 0,
    frame: null,
    accessoryItems: [
      { technicalKey: "accessory.din_rail", description: "Șină DIN", unit: "m", quantity: 0.5 },
    ],
  },
];

export function buildDefaultMaterialCatalog(): ProjectMaterialCatalog {
  const symbols = Object.fromEntries(
    SYMBOL_ENTRIES.map((entry) => [entry.symbolType, entry]),
  ) as ProjectMaterialCatalog["symbols"];

  return {
    symbols,
    cables: {
      [CABLE_3X15]: {
        technicalKey: CABLE_3X15,
        label: "Cablu N2XH 3x1,5 mm²",
        unit: "m",
        catalogCodeHint: "CAT-0058-alt",
      },
      [CABLE_3X25]: {
        technicalKey: CABLE_3X25,
        label: "Cablu N2XH 3x2,5 mm²",
        unit: "m",
        catalogCodeHint: "CAT-0058",
      },
      [CABLE_5X25]: {
        technicalKey: CABLE_5X25,
        label: "Cablu N2XH 5x2,5 mm²",
        unit: "m",
      },
      "cable.data.utp": {
        technicalKey: "cable.data.utp",
        label: "Cablu UTP Cat6",
        unit: "m",
      },
    },
    frames: {
      [FRAME_1M]: { technicalKey: FRAME_1M, label: "Ramă 1 modul", modules: 1 },
      [FRAME_2M]: { technicalKey: FRAME_2M, label: "Ramă 2 module", modules: 2 },
      [FRAME_3M]: { technicalKey: FRAME_3M, label: "Ramă 3 module", modules: 3 },
    },
    accessories: {
      "accessory.device_box": { technicalKey: "accessory.device_box", label: "Doză aparat", unit: "buc" },
      "accessory.wago_3": { technicalKey: "accessory.wago_3", label: "Conector tip WAGO 3 poli", unit: "buc" },
      "accessory.led_clip": { technicalKey: "accessory.led_clip", label: "Clemă bandă LED", unit: "buc" },
      "accessory.ip_gasket": { technicalKey: "accessory.ip_gasket", label: "Garnitură IP", unit: "buc" },
      "accessory.din_rail": { technicalKey: "accessory.din_rail", label: "Șină DIN", unit: "m" },
    },
  };
}

export const DEFAULT_MATERIAL_CATALOG = buildDefaultMaterialCatalog();
