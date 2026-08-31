import assert from "node:assert/strict";
import test from "node:test";
import {
  parseLegacyOffer,
  parseLegacyOfferWorkbook,
  parseCatalogRows,
  firstPopulatedSheet,
} from "../app/excel-import.ts";

test("imports Frizeo-exported offer xlsx rows", () => {
  const rows = [
    ["FIRMA SRL"],
    ["CUI RO123"],
    ["OFERTĂ OF-2026-0001"],
    ["Beneficiar", "Client Demo", "", "", "", "Data", "2026-03-01"],
    ["Lucrare", "Instalație electrică"],
    ["Monedă", "RON"],
    ["#", "Descriere", "Tip", "UM", "Cantitate", "Preț unitar fără TVA", "TVA (%)", "Preț unitar cu TVA", "Total cu TVA"],
    [1, "Cablu N2XH 3x2.5", "material", "m", 100, 4.5, 21, 5.445, 544.5],
    [2, "Montaj tablou", "labor", "buc", 1, 250, 19, 297.5, 297.5],
    [3, "Priză simplă", "material", "buc", 10, 25, 21, 30.25, 302.5],
  ];

  const imported = parseLegacyOffer(rows);
  assert.equal(imported.client, "Client Demo");
  assert.equal(imported.items.length, 3);
  assert.equal(imported.items[0].name, "Cablu N2XH 3x2.5");
  assert.equal(imported.items[0].unit, "m");
  assert.equal(imported.items[0].quantity, 100);
  assert.equal(imported.items[0].unitPrice, 4.5);
  assert.equal(imported.items[0].vatRate, 21);
  assert.equal(imported.items[1].kind, "labor");
  assert.equal(imported.items[1].vatRate, 19);
});

test("imports classic Romanian offer headers", () => {
  const rows = [
    ["OFERTA Lucrare X 01.02.2024"],
    ["Beneficiar: SC Client SRL"],
    ["Servicii / Materiale", "UM", "Cantitate", "Pret buc", "Pret fara TVA", "TVA"],
    ["Cablu CYKY 3x2.5", "m", 50, 3.2, 160, 33.6],
    ["Priza", "buc", 5, 20, 100, 21],
    ["Contravaloare manopera", "", "", "", 500],
  ];
  const imported = parseLegacyOffer(rows);
  assert.equal(imported.client, "SC Client SRL");
  assert.equal(imported.items.length, 2);
  assert.equal(imported.labor, 500);
  assert.equal(imported.items[0].unitPrice, 3.2);
});

test("infers unit price from net total when unit price column is missing", () => {
  const rows = [
    ["OFERTĂ Test"],
    ["Beneficiar", "Client X"],
    ["Denumire", "UM", "Cantitate", "Preț fără TVA", "TVA"],
    ["Cablu", "m", 10, 45, 9.45],
    ["Priză", "buc", 2, 50, 10.5],
  ];
  const imported = parseLegacyOffer(rows);
  assert.equal(imported.items.length, 2);
  assert.equal(imported.items[0].unitPrice, 4.5);
  assert.equal(imported.items[1].unitPrice, 25);
});

test("picks the offer sheet when cover sheet comes first", () => {
  const workbook = [
    {
      sheet: "Copertă",
      data: [
        ["OFERTĂ SPECIALĂ"],
        ["Beneficiar", "Doar pe copertă"],
        ["Fără poziții aici"],
      ],
    },
    {
      sheet: "Poziții",
      data: [
        ["#", "Descriere", "UM", "Cantitate", "Preț unitar", "Total"],
        [1, "Întrerupător", "buc", 4, 35, 140],
        [2, "Cablu", "m", 20, 3, 60],
      ],
    },
  ];
  const imported = parseLegacyOfferWorkbook(workbook);
  assert.equal(imported.items.length, 2);
  assert.equal(imported.items[0].name, "Întrerupător");
  assert.equal(firstPopulatedSheet(workbook)[0][1], "Descriere");
});

test("parses European number formats in prices", () => {
  const rows = [
    ["Descriere", "Cantitate", "Preț unitar"],
    ["Articol", "2", "1.250,50"],
  ];
  const imported = parseLegacyOffer(rows);
  assert.equal(imported.items.length, 1);
  assert.equal(imported.items[0].unitPrice, 1250.5);
});

test("rejects empty sheets with a clear error", () => {
  assert.throws(() => parseLegacyOffer([]), /gol|Nu am putut/i);
  assert.throws(() => parseLegacyOfferWorkbook([]), /Nu am găsit date/i);
});

test("catalog import accepts pret unitar fara TVA headers", () => {
  const rows = [
    ["Descriere", "UM", "Preț unitar fără TVA", "TVA (%)"],
    ["Articol A", "buc", 12.5, 21],
  ];
  const items = parseCatalogRows(rows);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Articol A");
  assert.equal(items[0].unitPrice, 12.5);
});
