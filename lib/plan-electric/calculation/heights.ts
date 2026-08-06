import { getSymbolDefinition } from "../symbols";
import type { CableSettings, SymbolInstance, SymbolType } from "../types";

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
