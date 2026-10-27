import { describe, expect, it } from "vitest";
import { recapMois } from "@/domain/calculs";
import { ficheExemple } from "../../tests/fixtures";
import { recapVersCsv } from "./export-csv";

const lignes = (csv: string) => csv.slice(1).split("\r\n");

describe("recapVersCsv (export Excel)", () => {
  const csv = recapVersCsv("2026-08", recapMois([ficheExemple()]));

  it("commence par le BOM UTF-8, pour qu'Excel lise les accents", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("séparateur « ; », fins de ligne Windows, virgule décimale", () => {
    expect(lignes(csv)[0]).toBe('"Bilan du mois";"2026-08"');
    expect(lignes(csv)).toContain('"Total en caisse";625');
    expect(lignes(csv)).toContain('"Deliveroo";3;45,5');
  });

  it("heures des employés en heures décimales", () => {
    // Sami : 4 h 30 le matin, 6 h 30 le soir, 11 h au total, 20 € d'acompte
    expect(lignes(csv)).toContain('"Sami";1;4,5;6,5;11;20');
  });

  it("guillemets dans un nom : doublés (pas de colonne cassée)", () => {
    const f = ficheExemple();
    f.employes = [{ nom: 'Jo "le chef"', acompte: null, matin: { da: "10:00", fs: "11:00" }, soir: { da: null, fs: null } }];
    expect(recapVersCsv("2026-08", recapMois([f]))).toContain('"Jo ""le chef""";1;1;0;1;0');
  });
});
