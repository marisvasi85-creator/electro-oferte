import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the public Frizeo Oferte authentication and onboarding", async () => {
  const [layout, auth, onboarding] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/company-onboarding.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Frizeo Oferte/);
  assert.match(auth, /Creează un cont/);
  assert.match(auth, /emailRedirectTo/);
  assert.doesNotMatch(auth, /marisvasi85@gmail\.com/);
  assert.match(onboarding, /Uși și ferestre PVC/);
  assert.match(onboarding, /createCompanyForUser/);
  assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("uses the public Supabase client and company-scoped persistence", async () => {
  const [client, page, data] = await Promise.all([
    readFile(new URL("../lib/supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/oferte-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(client, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(client, /SERVICE_ROLE/);
  assert.match(page, /loadBetaData/);
  assert.match(page, /saveRemoteOffer/);
  assert.match(page, /companySettings\.id/);
  assert.match(data, /company_id/);
  assert.match(data, /company_members/);
});
