import { describe, expect, it } from "vitest";
import { PLATEFORMES } from "./constantes";
import { ficheVide, nettoyerFiche, pointageVide } from "./fiche-vide";
import { FicheSchema } from "./types";

describe("ficheVide", () => {
  it("fiche vierge : valide pour le schéma, toutes les plateformes, 6 lignes employés", () => {
    const f = ficheVide("2026-08-29");
    expect(FicheSchema.safeParse(f).success).toBe(true);
    expect(f.date).toBe("2026-08-29");
    expect(f.commandesInternet.map((c) => c.plateforme)).toEqual([...PLATEFORMES]);
    expect(f.employes).toHaveLength(6);
  });

  it("sans date : prend la date du jour", () => {
    expect(ficheVide().date).toBe(new Date().toISOString().slice(0, 10));
  });

  it("lignes employés indépendantes : modifier l'une ne touche pas les autres", () => {
    const f = ficheVide("2026-08-29");
    f.employes[0].matin.da = "10:00";
    expect(f.employes[1].matin.da).toBeNull();
  });
});

describe("nettoyerFiche", () => {
  it("retire les lignes employés vides et garde celles qui ont une donnée", () => {
    const f = ficheVide("2026-08-29");
    f.employes[0].nom = "Sami";
    f.employes[2] = { ...pointageVide(), acompte: 10 };
    f.employes[4] = { ...pointageVide(), soir: { da: null, fs: "23:00" } };
    f.employes[5].nom = "   "; // que des espaces : vide

    const propre = nettoyerFiche(f);
    expect(propre.employes).toHaveLength(3);
    expect(propre.employes.map((e) => e.nom)).toEqual(["Sami", "", ""]);
  });

  it("ne modifie pas la fiche d'origine", () => {
    const f = ficheVide("2026-08-29");
    nettoyerFiche(f);
    expect(f.employes).toHaveLength(6);
  });
});
