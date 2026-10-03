import { test } from "node:test";
import assert from "node:assert/strict";
import { dateFr, formatHCourt, formatHeures } from "./format";

test("formatHeures : heures pleines et minutes sur deux chiffres", () => {
  assert.equal(formatHeures(0), "0 h");
  assert.equal(formatHeures(120), "2 h");
  assert.equal(formatHeures(450), "7 h 30");
  assert.equal(formatHeures(65), "1 h 05");
});

test("formatHCourt : version compacte", () => {
  assert.equal(formatHCourt(120), "2h");
  assert.equal(formatHCourt(450), "7h30");
  assert.equal(formatHCourt(65), "1h05");
});

test("dateFr : AAAA-MM-JJ vers JJ/MM/AAAA", () => {
  assert.equal(dateFr("2026-08-29"), "29/08/2026");
});
