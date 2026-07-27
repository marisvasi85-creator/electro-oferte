import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the beta authentication shell", async () => {
  const [layout, auth] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Electro Oferte · ElectricSmart/);
  assert.match(auth, /Autentificare beta/);
  assert.match(auth, /marisvasi85@gmail\.com/);
  assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("uses the public Supabase client and remote persistence", async () => {
  const [client, page] = await Promise.all([
    readFile(new URL("../lib/supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(client, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(client, /SERVICE_ROLE/);
  assert.match(page, /loadBetaData/);
  assert.match(page, /saveRemoteOffer/);
});
