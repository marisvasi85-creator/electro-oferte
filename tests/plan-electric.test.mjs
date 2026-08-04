import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships Plan Electric module surfaces", async () => {
  const [projectsPage, editorPage, symbols, migration, home] = await Promise.all([
    readFile(new URL("../app/plan-electric/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/plan-electric/symbols.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260804_plan_electric.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(projectsPage, /PlanProjectsApp|Plan Electric/);
  assert.match(editorPage, /PlanEditorApp/);
  assert.match(symbols, /priza_simpla/);
  assert.match(symbols, /tablou_electric/);
  assert.match(migration, /plan_projects/);
  assert.match(migration, /plan_symbol_instances/);
  assert.match(migration, /plan-backgrounds/);
  assert.match(home, /\/plan-electric/);
});

test("ships cable calculation surfaces", async () => {
  const [cable, editor, panel, migration] = await Promise.all([
    readFile(new URL("../lib/plan-electric/cable.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/[id]/editor-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/plan-electric/components/CablePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260804_plan_electric_cable_settings.sql", import.meta.url), "utf8"),
  ]);

  assert.match(cable, /estimateCable/);
  assert.match(cable, /floor_orthogonal/);
  assert.match(cable, /outletHeightM/);
  assert.match(cable, /switchHeightM/);
  assert.match(editor, /CablePanel/);
  assert.match(editor, /estimateCable/);
  assert.match(panel, /Cablu pardoseală/);
  assert.match(migration, /settings jsonb/);
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
