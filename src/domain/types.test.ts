import { describe, expect, it } from "vitest";
import { ficheExemple } from "../../tests/fixtures";
import { ExtractionSchema, FicheSchema } from "./types";

describe("FicheSchema", () => {
  it("fiche complète : acceptée", () => {
    expect(FicheSchema.safeParse(ficheExemple()).success).toBe(true);
  });

  it("montant en texte : refusé", () => {
    const f = { ...ficheExemple(), achats: "15" };
    expect(FicheSchema.safeParse(f).success).toBe(false);
  });

  it("plateforme inconnue : refusée", () => {
    const f = ficheExemple();
    const avecPlateformeInconnue = {
      ...f,
      commandesInternet: [{ plateforme: "Glovo", nbCommandes: 1, modePaiement: null, total: 10 }],
    };
    expect(FicheSchema.safeParse(avecPlateformeInconnue).success).toBe(false);
  });

  it("champ obligatoire absent : refusé", () => {
    const { employes: _absent, ...sansEmployes } = ficheExemple();
    expect(FicheSchema.safeParse(sansEmployes).success).toBe(false);
  });
});

describe("ExtractionSchema", () => {
  it("exige la liste des doutes en plus de la fiche", () => {
    expect(ExtractionSchema.safeParse(ficheExemple()).success).toBe(false);
    expect(ExtractionSchema.safeParse({ ...ficheExemple(), doutes: ["soir.especes"] }).success).toBe(true);
  });
});
