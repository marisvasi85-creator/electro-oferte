import { getCatalogEntry } from "../../catalog";
import { getSymbolDefinition } from "../../symbols";
import type {
  AccessoryTotal,
  CalculationContribution,
  CalculationRule,
  DeviceTypeTotal,
} from "../types";

const DEVICE_BOX_KEY = "accessory.device_box";

/**
 * Aggregates devices, mounting boxes, frames and accessories from catalog metadata.
 * No symbol-specific hardcoding — the engine only reads SymbolCatalogEntry fields.
 */
export const devicesRule: CalculationRule = {
  id: "devices.aggregate",
  name: "Aparate, doze, rame și accesorii",
  apply(ctx): CalculationContribution {
    const byType = new Map<string, DeviceTypeTotal>();
    const accessoryMap = new Map<string, AccessoryTotal>();
    const diagnostics: string[] = [];

    for (const symbol of ctx.symbols) {
      const entry = getCatalogEntry(symbol.symbolType, ctx.catalog);
      const def = getSymbolDefinition(symbol.symbolType);

      if (entry.category !== "panel" && entry.category !== "other") {
        const current = byType.get(entry.symbolType) ?? {
          symbolType: entry.symbolType,
          label: def.label,
          category: entry.category,
          count: 0,
          deviceBoxes: 0,
          frames: 0,
          frameKey: entry.frame,
          cableType: entry.cableType,
          circuit: entry.circuit,
          switchKind: entry.switchKind,
          extraConductors: 0,
        };
        current.count += 1;
        current.deviceBoxes += Math.max(0, entry.deviceBoxes);
        current.extraConductors += Math.max(0, entry.extraConductors ?? 0);
        if (entry.frame && entry.modules > 0) {
          current.frames += 1;
          current.frameKey = entry.frame;
        }
        byType.set(entry.symbolType, current);
      }

      if (entry.frame && entry.modules > 0) {
        const frame = ctx.catalog.frames[entry.frame];
        if (!frame) {
          diagnostics.push(`Ramă lipsă din catalog: ${entry.frame} (${entry.symbolType})`);
        } else {
          bumpAccessory(accessoryMap, {
            technicalKey: frame.technicalKey,
            label: frame.label,
            unit: "buc",
            quantity: 1,
          });
        }
      }

      for (const accessory of entry.accessoryItems) {
        // Device boxes are counted via entry.deviceBoxes (source of truth).
        if (accessory.technicalKey === DEVICE_BOX_KEY) continue;
        const article = ctx.catalog.accessories[accessory.technicalKey];
        if (!article) {
          diagnostics.push(`Accesoriu lipsă din catalog: ${accessory.technicalKey}`);
          continue;
        }
        bumpAccessory(accessoryMap, {
          technicalKey: article.technicalKey,
          label: article.label,
          unit: article.unit,
          quantity: accessory.quantity,
        });
      }
    }

    return {
      deviceTotals: [...byType.values()].sort((a, b) => a.label.localeCompare(b.label, "ro")),
      accessories: [...accessoryMap.values()].sort((a, b) => a.label.localeCompare(b.label, "ro")),
      diagnostics,
    };
  },
};

function bumpAccessory(map: Map<string, AccessoryTotal>, item: AccessoryTotal) {
  const current = map.get(item.technicalKey);
  if (!current) {
    map.set(item.technicalKey, { ...item });
    return;
  }
  current.quantity += item.quantity;
}
