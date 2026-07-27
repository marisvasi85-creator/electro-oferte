import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the public Frizeo Oferte authentication and onboarding", async () => {
  const [layout, auth, onboarding, recovery] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/company-onboarding.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/recovery/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Frizeo Oferte/);
  assert.match(auth, /Creează un cont/);
  assert.match(auth, /emailRedirectTo/);
  assert.match(auth, /resetPasswordForEmail/);
  assert.match(auth, /\/recovery/);
  assert.match(auth, /password-toggle/);
  assert.match(auth, /\/termeni/);
  assert.match(auth, /\/confidentialitate/);
  assert.doesNotMatch(auth, /marisvasi85@gmail\.com/);
  assert.match(onboarding, /Uși și ferestre PVC/);
  assert.match(onboarding, /createCompanyForUser/);
  assert.match(onboarding, /mode/);
  assert.match(onboarding, /Adaugă o firmă nouă/);
  assert.match(recovery, /updateUser/);
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
  assert.match(page, /FRIZEO OFERTE/);
  assert.match(page, /CompanySwitcher/);
  assert.match(page, /preferredCompanyId/);
  assert.match(page, /draftStorageKey/);
  assert.match(page, /ACTIVE_COMPANY_KEY/);
  assert.match(page, /Adaugă firmă|startAddCompany/);
  assert.doesNotMatch(page, /ElectricSmart/);
  assert.doesNotMatch(page, /teomaris27@gmail\.com/);
  assert.doesNotMatch(page, /0751 970 357/);
  assert.doesNotMatch(page, /marisvasi85@gmail\.com/);
  assert.doesNotMatch(page, /electric-smart-logo/);
  assert.match(data, /company_id/);
  assert.match(data, /company_members/);
  assert.match(data, /listUserCompanies/);
  assert.match(data, /preferredCompanyId/);
});

test("ships Romanian validation, security headers and legal pages", async () => {
  const [validation, nextConfig, termeni, privacy, robots, sitemap] = await Promise.all([
    readFile(new URL("../lib/ro-validation.ts", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/termeni/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/confidentialitate/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
  ]);

  assert.match(validation, /isValidRomanianCui/);
  assert.match(validation, /passwordStrength/);
  assert.match(nextConfig, /Strict-Transport-Security/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(termeni, /Termeni și condiții/);
  assert.match(privacy, /GDPR/);
  assert.match(privacy, /marisvasi85@gmail\.com/);
  assert.match(termeni, /marisvasi85@gmail\.com/);
  assert.match(robots, /disallow: \["\/recovery"\]/);
  assert.match(sitemap, /oferte\.frizeo\.ro/);
  assert.match(sitemap, /\/confidentialitate/);
});
