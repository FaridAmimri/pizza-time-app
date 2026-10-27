import { describe, expect, it } from "vitest";
import { aujourdhui, dateFr, dateLongue, eur, formatHCourt, formatHeures, jourCourt, moisLong } from "./format";

/** Intl utilise des espaces insécables : on les remplace pour comparer simplement. */
const espaces = (s: string) => s.replace(/\s/g, " ");

describe("format", () => {
  it("formatHeures : heures pleines et minutes sur deux chiffres", () => {
    expect(formatHeures(0)).toBe("0 h");
    expect(formatHeures(120)).toBe("2 h");
    expect(formatHeures(450)).toBe("7 h 30");
    expect(formatHeures(65)).toBe("1 h 05");
  });

  it("formatHCourt : version compacte", () => {
    expect(formatHCourt(120)).toBe("2h");
    expect(formatHCourt(450)).toBe("7h30");
    expect(formatHCourt(65)).toBe("1h05");
  });

  it("dateFr : AAAA-MM-JJ vers JJ/MM/AAAA", () => {
    expect(dateFr("2026-08-29")).toBe("29/08/2026");
  });

  it("eur : format monétaire français", () => {
    expect(espaces(eur(1234.5))).toBe("1 234,50 €");
    expect(espaces(eur(-25))).toBe("-25,00 €");
  });

  it("dates en lettres : pas de décalage de fuseau", () => {
    expect(jourCourt("2026-08-29")).toBe("sam. 29");
    expect(dateLongue("2026-08-29")).toBe("samedi 29 août 2026");
    expect(moisLong("2026-08")).toBe("août 2026");
  });

  it("aujourdhui : date locale au format AAAA-MM-JJ", () => {
    expect(aujourdhui()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
