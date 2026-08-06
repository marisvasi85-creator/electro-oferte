export type {
  AccessorySpec,
  CableArticle,
  DeviceCategory,
  FrameArticle,
  ProjectMaterialCatalog,
  SwitchKind,
  SymbolCatalogEntry,
} from "./types";
export { buildDefaultMaterialCatalog, DEFAULT_MATERIAL_CATALOG } from "./defaults";

import type { SymbolType } from "../types";
import { DEFAULT_MATERIAL_CATALOG } from "./defaults";
import type { ProjectMaterialCatalog, SymbolCatalogEntry } from "./types";

export function getCatalogEntry(
  symbolType: SymbolType,
  catalog: ProjectMaterialCatalog = DEFAULT_MATERIAL_CATALOG,
): SymbolCatalogEntry {
  return catalog.symbols[symbolType] ?? {
    symbolType,
    category: "other",
    cableType: "cable.n2xh.3x1.5",
    circuit: "Diverse",
    deviceBoxes: 0,
    modules: 0,
    frame: null,
    accessoryItems: [],
  };
}
