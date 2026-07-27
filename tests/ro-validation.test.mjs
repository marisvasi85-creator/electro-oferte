import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidRomanianCui,
  isValidRomanianIban,
  isValidRomanianPhone,
  passwordStrength,
} from "../lib/ro-validation.ts";

test("validates Romanian CUI checksum", () => {
  assert.equal(isValidRomanianCui(""), true);
  assert.equal(isValidRomanianCui("RO123"), false);
  assert.equal(isValidRomanianCui("123"), false);
  // Known-valid style check: algorithm rejects bad control digit
  assert.equal(isValidRomanianCui("1"), false);
});

test("validates Romanian phone numbers", () => {
  assert.equal(isValidRomanianPhone(""), true);
  assert.equal(isValidRomanianPhone("0751234567"), true);
  assert.equal(isValidRomanianPhone("+40751234567"), true);
  assert.equal(isValidRomanianPhone("123"), false);
});

test("validates Romanian IBAN shape and checksum", () => {
  assert.equal(isValidRomanianIban(""), true);
  assert.equal(isValidRomanianIban("RO13RNCB0000000000000001"), true);
  assert.equal(isValidRomanianIban("RO00RNCB0000000000000001"), false);
  assert.equal(isValidRomanianIban("DE89370400440532013000"), false);
});

test("scores password strength", () => {
  assert.equal(passwordStrength("abc"), "slabă");
  assert.equal(passwordStrength("Abcdefg1"), "medie");
  assert.equal(passwordStrength("Abcdefg1!xyz"), "puternică");
});
