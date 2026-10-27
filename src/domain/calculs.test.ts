import { describe, expect, it } from "vitest";
import {
  alertes,
  dureeMinutes,
  ecartCaisse,
  grilleHeures,
  heuresEmploye,
  joursDuMois,
  joursSansFiche,
  minutesEquipe,
  recapMois,
  totalEnCaisse,
} from "./calculs";
import { ficheVide } from "./fiche-vide";

function ficheExemple() {
  const f = ficheVide("2026-08-29");
  f.matin = { totalEnBon: null, totalEnCaisse: 170, especes: 100, ticketRestaurant: 20, carteBancaire: 50 };
  f.soir = { especes: 200, ticketRestaurant: 30, carteBancaire: 150, chequeVacance: 10, dishopEnLigne: 40 };
  f.achats = 15;
  f.totauxEcrits = { totalEnBon: 12, totalEnCaisse: 625 };
  f.employes = [
    { nom: "Sami", acompte: 20, matin: { da: "10:00", fs: "14:30" }, soir: { da: "18:00", fs: "00:30" } },
    { nom: "  sami ", acompte: null, matin: { da: "11:00", fs: "14:00" }, soir: { da: null, fs: null } },
    { nom: "Lina", acompte: null, matin: { da: "10:00", fs: null }, soir: { da: null, fs: null } },
  ];
  return f;
}

describe("calculs", () => {
  it("durée : passage de minuit", () => {
    expect(dureeMinutes("18:00", "00:30")).toBe(390);
    expect(dureeMinutes("10:00", "14:30")).toBe(270);
    expect(dureeMinutes(null, "14:30")).toBe(0);
  });

  it("heures d'un employé + détection d'oubli", () => {
    const f = ficheExemple();
    expect(heuresEmploye(f.employes[0])).toEqual({ matin: 270, soir: 390, journee: 660, incomplet: false });
    expect(heuresEmploye(f.employes[2]).incomplet).toBe(true);
  });

  it("total en caisse = espèces + tickets + CB + Dishop + acomptes + achats", () => {
    const f = ficheExemple();
    // 300 + 50 + 200 + 40 + 20 + 15 = 625
    expect(totalEnCaisse(f)).toBe(625);
    expect(ecartCaisse(f)).toBe(0);
    f.totauxEcrits.totalEnCaisse = 600;
    expect(ecartCaisse(f)).toBe(25);
  });

  it("bilan du mois : regroupe un même employé écrit différemment", () => {
    const r = recapMois([ficheExemple(), ficheExemple()]);
    expect(r.nbFiches).toBe(2);
    expect(r.recettes.totalEnCaisse).toBe(1250);
    const sami = r.employes.find((e) => e.nom === "Sami");
    expect(sami?.journee).toBe(2 * (660 + 180));
    expect(sami?.acomptes).toBe(40);
    expect(r.employes.length).toBe(2);
  });

  it("jours du mois, y compris février bissextile", () => {
    expect(joursDuMois("2026-10").length).toBe(31);
    expect(joursDuMois("2028-02").length).toBe(29);
    expect(joursDuMois("2026-02").length).toBe(28);
    expect(joursDuMois("2026-10")[0]).toBe("2026-10-01");
    expect(joursDuMois("2026-10")[30]).toBe("2026-10-31");
  });

  it("jours sans fiche : ignore le futur", () => {
    const f = ficheExemple(); // 2026-08-29
    const manquants = joursSansFiche("2026-08", [f], "2026-08-31");
    expect(manquants.length).toBe(30);
    expect(manquants.includes("2026-08-29")).toBe(false);
    expect(joursSansFiche("2026-08", [f], "2026-08-02")).toEqual(["2026-08-01", "2026-08-02"]);
    expect(joursSansFiche("2026-08", [], "2026-07-31")).toEqual([]);
  });

  it("minutes de l'équipe sur une fiche", () => {
    // Sami 660 + Sami (même nom, autre ligne) 180 + Lina (heure manquante) 0
    expect(minutesEquipe(ficheExemple())).toBe(840);
  });

  it("alertes : écart de caisse et heure manquante", () => {
    const ok = ficheExemple();
    ok.employes = ok.employes.slice(0, 2);
    expect(alertes([ok])).toEqual([]);

    const ko = ficheExemple();
    ko.totauxEcrits.totalEnCaisse = 600;
    expect(alertes([ko])).toEqual([
      { type: "ecart-caisse", date: "2026-08-29", ecart: 25 },
      { type: "heure-manquante", date: "2026-08-29", employes: ["Lina"] },
    ]);
  });

  it("grille d'heures : regroupe par employé et par jour", () => {
    const f1 = ficheExemple();
    const f2 = ficheExemple();
    f2.date = "2026-08-30";
    const grille = grilleHeures([f1, f2]);
    expect(grille.length).toBe(2);
    const sami = grille.find((l) => l.nom === "Sami");
    expect(sami?.parJour["2026-08-29"]).toBe(840);
    expect(sami?.parJour["2026-08-30"]).toBe(840);
    expect(sami?.total).toBe(1680);
    expect(sami?.acomptes).toBe(40);
    const lina = grille.find((l) => l.nom === "Lina");
    expect(lina?.joursIncomplets).toEqual(["2026-08-29", "2026-08-30"]);
  });
});
