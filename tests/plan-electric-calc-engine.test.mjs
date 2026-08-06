import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProject,
  estimateCable,
  mergeCableSettings,
} from "../lib/plan-electric/cable";
import { DEFAULT_MATERIAL_CATALOG } from "../lib/plan-electric/catalog";
import { registerCalculationRule, runCalculationEngine } from "../lib/plan-electric/calculation";

function sym(partial) {
  return {
    id: partial.id,
    pageId: "page-1",
    symbolType: partial.symbolType,
    x: partial.x,
    y: partial.y,
    rotation: 0,
    scale: 1,
    label: partial.label ?? "",
    notes: "",
    metadata: {},
  };
}

const calibrated = mergeCableSettings({
  metersPerPixel: 0.01, // 1 px = 1 cm
  reservePercent: 10,
  routing: "floor_orthogonal",
  routingMode: "circuit_tree",
  outletHeightM: 0.4,
  switchHeightM: 1.1,
  panelHeightM: 1.5,
  lightHeightM: 2.5,
});

test("catalog metadata drives cable type, boxes and frames without engine hardcoding", () => {
  const simple = DEFAULT_MATERIAL_CATALOG.symbols.priza_simpla;
  const double = DEFAULT_MATERIAL_CATALOG.symbols.priza_dubla;
  const triple = DEFAULT_MATERIAL_CATALOG.symbols.priza_tripla;
  const staircase = DEFAULT_MATERIAL_CATALOG.symbols.intrerupator_cap_scara;

  assert.equal(simple.cableType, "cable.n2xh.3x2.5");
  assert.equal(simple.deviceBoxes, 1);
  assert.equal(double.deviceBoxes, 2);
  assert.equal(triple.deviceBoxes, 3);
  assert.equal(simple.circuit, "Prize");
  assert.equal(staircase.cableType, "cable.n2xh.3x1.5");
  assert.equal(staircase.switchKind, "staircase");
  assert.equal(staircase.extraConductors, 1);
});

test("engine aggregates sockets, switches, lights, boxes, frames and accessories", () => {
  const symbols = [
    sym({ id: "p1", symbolType: "tablou_electric", x: 0, y: 0 }),
    sym({ id: "s1", symbolType: "priza_simpla", x: 100, y: 0 }),
    sym({ id: "s2", symbolType: "priza_dubla", x: 200, y: 0 }),
    sym({ id: "s3", symbolType: "priza_tripla", x: 300, y: 0 }),
    sym({ id: "w1", symbolType: "intrerupator_simplu", x: 100, y: 100 }),
    sym({ id: "w2", symbolType: "intrerupator_cap_scara", x: 200, y: 100 }),
    sym({ id: "l1", symbolType: "corp_iluminat", x: 300, y: 100 }),
    sym({ id: "led1", symbolType: "led", x: 400, y: 100 }),
  ];

  const result = calculateProject(symbols, calibrated);

  assert.equal(result.counts.sockets, 3);
  assert.equal(result.counts.switches, 2);
  assert.equal(result.counts.lights, 2);
  assert.equal(result.deviceBoxes, 1 + 2 + 3 + 1 + 1); // sockets + switches
  assert.equal(result.frames.reduce((sum, item) => sum + item.quantity, 0), 5);
  assert.ok(result.cables.some((cable) => cable.technicalKey === "cable.n2xh.3x2.5"));
  assert.ok(result.cables.some((cable) => cable.technicalKey === "cable.n2xh.3x1.5"));
  assert.ok(result.billOfMaterials.some((line) => line.technicalKey === "accessory.device_box"));
  assert.ok(result.billOfMaterials.some((line) => line.technicalKey === "accessory.wago_3"));
  assert.ok(result.billOfMaterials.some((line) => line.technicalKey === "accessory.led_clip"));
  assert.ok(result.totals.cableWithReserveM > result.totals.cableRawM);
});

test("circuit_tree routing uses less floor cable than home_run for clustered sockets", () => {
  const symbols = [
    sym({ id: "p1", symbolType: "tablou_electric", x: 0, y: 0 }),
    sym({ id: "a", symbolType: "priza_simpla", x: 500, y: 0 }),
    sym({ id: "b", symbolType: "priza_simpla", x: 520, y: 0 }),
    sym({ id: "c", symbolType: "priza_simpla", x: 540, y: 0 }),
  ];

  const tree = calculateProject(symbols, { ...calibrated, routingMode: "circuit_tree" });
  const home = calculateProject(symbols, { ...calibrated, routingMode: "home_run" });

  assert.ok(tree.totals.cableRawM < home.totals.cableRawM);
  // Home-run: 3×(drop 1.5 + floor 5/5.2/5.4 + rise 0.4)
  assert.ok(home.segments.length === 3);
  // Tree: 3 edges but shorter aggregate floor path
  assert.ok(tree.segments.length === 3);
});

test("home-run formula still equals panel drop + orthogonal floor + device rise", () => {
  const symbols = [
    sym({ id: "p1", symbolType: "tablou_electric", x: 0, y: 0 }),
    sym({ id: "o1", symbolType: "priza_simpla", x: 300, y: 400 }),
  ];
  const result = calculateProject(symbols, { ...calibrated, routingMode: "home_run" });
  assert.equal(result.segments.length, 1);
  const segment = result.segments[0];
  assert.equal(Number(segment.floorM.toFixed(2)), 7);
  assert.equal(Number(segment.totalM.toFixed(2)), 8.9);
  assert.equal(Number(result.totals.cableWithReserveM.toFixed(2)), 9.79);
});

test("legacy estimateCable facade stays compatible", () => {
  const symbols = [
    sym({ id: "p1", symbolType: "tablou_electric", x: 0, y: 0 }),
    sym({ id: "o1", symbolType: "priza_simpla", x: 100, y: 0 }),
  ];
  const estimate = estimateCable(symbols, calibrated);
  assert.equal(estimate.calibrated, true);
  assert.equal(estimate.missingPanel, false);
  assert.equal(estimate.panelCount, 1);
  assert.ok(estimate.withReserveM >= estimate.rawTotalM);
  assert.ok(Array.isArray(estimate.routeSegments));
  assert.ok(estimate.routeSegments.length > 0);
});

test("registerCalculationRule extends engine without changing core rules", () => {
  registerCalculationRule({
    id: "test.future-i7",
    name: "Stub I7",
    apply() {
      return { diagnostics: ["I7 stub rule active"] };
    },
  });

  const result = runCalculationEngine({
    symbols: [sym({ id: "p1", symbolType: "tablou_electric", x: 0, y: 0 })],
    config: calibrated,
  });
  assert.ok(result.diagnostics.includes("I7 stub rule active"));
});
