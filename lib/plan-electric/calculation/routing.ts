import { getCatalogEntry } from "../catalog";
import type { ProjectMaterialCatalog } from "../catalog/types";
import type { SymbolInstance } from "../types";
import { getSymbolDefinition } from "../symbols";
import { horizontalMeters, pixelDistance } from "./geometry";
import { resolveMountingHeightM } from "./heights";
import type { CalculationConfig, RouteSegment } from "./types";

type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: "panel" | "device";
  heightM: number;
  symbol?: SymbolInstance;
};

/**
 * Build logical cable segments per circuit.
 * Default strategy: nearest-neighbor spanning tree (panel + devices),
 * so devices are not all home-run independently from the panel.
 */
export function buildCircuitRoutes(
  symbols: SymbolInstance[],
  config: CalculationConfig,
  catalog: ProjectMaterialCatalog,
): { segments: RouteSegment[]; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const panels = symbols.filter((symbol) => symbol.symbolType === "tablou_electric");
  if (!config.metersPerPixel || config.metersPerPixel <= 0) {
    return { segments: [], diagnostics: ["Scară necalibrată — lungimile de cablu nu pot fi calculate."] };
  }
  if (!panels.length) {
    return { segments: [], diagnostics: ["Lipsește tabloul electric pe plan."] };
  }

  const consumers = symbols.filter((symbol) => {
    const entry = getCatalogEntry(symbol.symbolType, catalog);
    return entry.category !== "panel" && entry.category !== "other";
  });

  const byCircuit = new Map<string, SymbolInstance[]>();
  for (const device of consumers) {
    const entry = getCatalogEntry(device.symbolType, catalog);
    const list = byCircuit.get(entry.circuit) ?? [];
    list.push(device);
    byCircuit.set(entry.circuit, list);
  }

  const segments: RouteSegment[] = [];

  for (const [circuit, devices] of byCircuit) {
    if (!devices.length) continue;
    const cableType = getCatalogEntry(devices[0].symbolType, catalog).cableType;

    // Assign each device to nearest panel, then route within that panel group.
    const groups = new Map<string, { panel: SymbolInstance; devices: SymbolInstance[] }>();
    for (const device of devices) {
      const panel = panels.reduce((best, candidate) => (
        pixelDistance(candidate, device) < pixelDistance(best, device) ? candidate : best
      ));
      const group = groups.get(panel.id) ?? { panel, devices: [] };
      group.devices.push(device);
      groups.set(panel.id, group);
    }

    for (const group of groups.values()) {
      const panelNode: Node = {
        id: group.panel.id,
        x: group.panel.x,
        y: group.panel.y,
        label: group.panel.label || "Tablou",
        kind: "panel",
        heightM: resolveMountingHeightM(group.panel, config),
      };

      if (config.routingMode === "home_run") {
        for (const device of group.devices) {
          segments.push(makeSegment({
            from: panelNode,
            to: toDeviceNode(device, config),
            circuit,
            cableType,
            panelId: group.panel.id,
            config,
            includePanelDrop: true,
          }));
        }
        continue;
      }

      // Circuit tree: Prim/nearest-neighbor spanning tree.
      const remaining = group.devices.map((device) => toDeviceNode(device, config));
      const connected: Node[] = [panelNode];
      let panelDropApplied = false;

      while (remaining.length) {
        let bestFrom: Node | null = null;
        let bestToIndex = -1;
        let bestDist = Number.POSITIVE_INFINITY;

        for (const from of connected) {
          for (let index = 0; index < remaining.length; index += 1) {
            const dist = pixelDistance(from, remaining[index]);
            if (dist < bestDist) {
              bestDist = dist;
              bestFrom = from;
              bestToIndex = index;
            }
          }
        }

        if (!bestFrom || bestToIndex < 0) break;
        const [next] = remaining.splice(bestToIndex, 1);
        const includePanelDrop = !panelDropApplied && bestFrom.kind === "panel";
        if (includePanelDrop) panelDropApplied = true;

        segments.push(makeSegment({
          from: bestFrom,
          to: next,
          circuit,
          cableType,
          panelId: group.panel.id,
          config,
          includePanelDrop,
        }));
        connected.push(next);
      }

      if (!panelDropApplied && group.devices.length) {
        diagnostics.push(`Circuit „${circuit}”: coborârea din tablou nu a putut fi asociată unui segment.`);
      }
    }
  }

  return { segments, diagnostics };
}

function toDeviceNode(device: SymbolInstance, config: CalculationConfig): Node {
  return {
    id: device.id,
    x: device.x,
    y: device.y,
    label: device.label || getSymbolDefinition(device.symbolType).label,
    kind: "device",
    heightM: resolveMountingHeightM(device, config),
    symbol: device,
  };
}

function makeSegment(input: {
  from: Node;
  to: Node;
  circuit: string;
  cableType: string;
  panelId: string;
  config: CalculationConfig;
  includePanelDrop: boolean;
}): RouteSegment {
  const floorM = horizontalMeters(input.from, input.to, input.config.metersPerPixel!, input.config.routing);
  const dropM = input.includePanelDrop ? Math.max(0, input.from.kind === "panel" ? input.from.heightM : 0) : 0;
  const riseM = input.to.kind === "device" ? Math.max(0, input.to.heightM) : 0;
  const device = input.to.symbol;
  const category = device
    ? (device.symbolType === "detector_fum" || device.symbolType === "detector_gaz"
      ? "diverse"
      : getSymbolDefinition(device.symbolType).category)
    : "diverse";

  return {
    id: `${input.from.id}->${input.to.id}`,
    circuit: input.circuit,
    cableType: input.cableType,
    fromId: input.from.id,
    toId: input.to.id,
    fromLabel: input.from.label,
    toLabel: input.to.label,
    floorM,
    dropM,
    riseM,
    totalM: dropM + floorM + riseM,
    deviceId: input.to.id,
    panelId: input.panelId,
    category,
  };
}
