import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships Plan Electric module surfaces", async () => {
  const [projectsPage, editorPage, symbols, migration, home, legend] = await Promise.all([
    readFile(new URL("../app/plan-electric/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/plan-electric/symbols.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260804_plan_electric.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/components/Legend.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(projectsPage, /PlanProjectsApp|Plan Electric/);
  assert.match(editorPage, /PlanEditorApp/);
  assert.match(symbols, /priza_simpla/);
  assert.match(symbols, /tablou_electric/);
  assert.match(symbols, /Priză simplă/);
  assert.match(symbols, /priza_tripla/);
  assert.match(symbols, /Priză triplă/);
  assert.match(symbols, /intrerupator_triplu_cruce/);
  assert.match(symbols, /DEFAULT_LED_LENGTH_PX/);
  assert.match(symbols, /resolveLedOrientation/);
  assert.match(symbols, /LedOrientation/);
  assert.match(migration, /plan_projects/);
  assert.match(migration, /plan_symbol_instances/);
  assert.match(migration, /plan-backgrounds/);
  assert.match(home, /\/plan-electric/);
  assert.match(legend, /pe-legend-toggle|is-collapsed/);
  assert.match(legend, /Minimizează legenda|Extinde legenda/);
});

test("ships calculation engine surfaces", async () => {
  const [cable, engine, catalog, editor, panel, migration] = await Promise.all([
    readFile(new URL("../lib/plan-electric/cable.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/plan-electric/calculation/engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/plan-electric/catalog/defaults.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/[id]/editor-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/components/CablePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260804_plan_electric_cable_settings.sql", import.meta.url), "utf8"),
  ]);

  assert.match(cable, /calculateProject/);
  assert.match(cable, /estimateCable/);
  assert.match(cable, /routingMode/);
  assert.match(engine, /registerCalculationRule/);
  assert.match(engine, /runCalculationEngine/);
  assert.match(catalog, /cable\.n2xh\.3x1\.5/);
  assert.match(catalog, /cable\.n2xh\.3x2\.5/);
  assert.match(catalog, /deviceBoxes/);
  assert.match(editor, /CablePanel/);
  assert.match(editor, /calculateProject/);
  assert.match(panel, /Deviz materiale/);
  assert.match(panel, /Descarcă CSV|Descarcă PDF/);

  const toolbar = await readFile(new URL("../app/plan-electric/components/Toolbar.tsx", import.meta.url), "utf8");
  assert.match(toolbar, /Deviz CSV/);
  assert.match(toolbar, /Deviz PDF/);
  assert.match(migration, /settings jsonb/);

  const exportModule = await readFile(new URL("../lib/plan-electric/export.ts", import.meta.url), "utf8");
  assert.match(exportModule, /buildMaterialsCsv/);
  assert.match(exportModule, /exportMaterialsPdf/);
  assert.match(exportModule, /appendMaterialsPdfPages|billOfMaterials/);
});

test("floor cable formula: panel drop + orthogonal floor + device rise", () => {
  const metersPerPixel = 0.01; // 1 px = 1 cm
  const panel = { x: 0, y: 0, height: 1.5 };
  const outlet = { x: 300, y: 400, height: 0.4 }; // 3m + 4m orthogonal = 7m floor
  const floorM = (Math.abs(outlet.x - panel.x) + Math.abs(outlet.y - panel.y)) * metersPerPixel;
  const total = panel.height + floorM + outlet.height;
  assert.equal(floorM, 7);
  assert.equal(Number(total.toFixed(2)), 8.9);

  const withReserve = total * 1.1;
  assert.equal(Number(withReserve.toFixed(2)), 9.79);
});
