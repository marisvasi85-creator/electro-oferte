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
