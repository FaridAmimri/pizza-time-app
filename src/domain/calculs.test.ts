import { test } from "node:test";
import assert from "node:assert/strict";
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

test("durée : passage de minuit", () => {
  assert.equal(dureeMinutes("18:00", "00:30"), 390);
  assert.equal(dureeMinutes("10:00", "14:30"), 270);
  assert.equal(dureeMinutes(null, "14:30"), 0);
});

test("heures d'un employé + détection d'oubli", () => {
  const f = ficheExemple();
  assert.deepEqual(heuresEmploye(f.employes[0]), { matin: 270, soir: 390, journee: 660, incomplet: false });
  assert.equal(heuresEmploye(f.employes[2]).incomplet, true);
});

test("total en caisse = espèces + tickets + CB + Dishop + acomptes + achats", () => {
  const f = ficheExemple();
  // 300 + 50 + 200 + 40 + 20 + 15 = 625
  assert.equal(totalEnCaisse(f), 625);
  assert.equal(ecartCaisse(f), 0);
  f.totauxEcrits.totalEnCaisse = 600;
  assert.equal(ecartCaisse(f), 25);
});

test("bilan du mois : regroupe un même employé écrit différemment", () => {
  const r = recapMois([ficheExemple(), ficheExemple()]);
  assert.equal(r.nbFiches, 2);
  assert.equal(r.recettes.totalEnCaisse, 1250);
  const sami = r.employes.find((e) => e.nom === "Sami");
  assert.equal(sami?.journee, 2 * (660 + 180));
  assert.equal(sami?.acomptes, 40);
  assert.equal(r.employes.length, 2);
});

test("jours du mois, y compris février bissextile", () => {
  assert.equal(joursDuMois("2026-10").length, 31);
  assert.equal(joursDuMois("2028-02").length, 29);
  assert.equal(joursDuMois("2026-02").length, 28);
  assert.equal(joursDuMois("2026-10")[0], "2026-10-01");
  assert.equal(joursDuMois("2026-10")[30], "2026-10-31");
});

test("jours sans fiche : ignore le futur", () => {
  const f = ficheExemple(); // 2026-08-29
  const manquants = joursSansFiche("2026-08", [f], "2026-08-31");
  assert.equal(manquants.length, 30);
  assert.equal(manquants.includes("2026-08-29"), false);
  assert.deepEqual(joursSansFiche("2026-08", [f], "2026-08-02"), ["2026-08-01", "2026-08-02"]);
  assert.deepEqual(joursSansFiche("2026-08", [], "2026-07-31"), []);
});

test("minutes de l'équipe sur une fiche", () => {
  // Sami 660 + Sami (même nom, autre ligne) 180 + Lina (heure manquante) 0
  assert.equal(minutesEquipe(ficheExemple()), 840);
});

test("alertes : écart de caisse et heure manquante", () => {
  const ok = ficheExemple();
  ok.employes = ok.employes.slice(0, 2);
  assert.deepEqual(alertes([ok]), []);

  const ko = ficheExemple();
  ko.totauxEcrits.totalEnCaisse = 600;
  assert.deepEqual(alertes([ko]), [
    { type: "ecart-caisse", date: "2026-08-29", ecart: 25 },
    { type: "heure-manquante", date: "2026-08-29", employes: ["Lina"] },
  ]);
});

test("grille d'heures : regroupe par employé et par jour", () => {
  const f1 = ficheExemple();
  const f2 = ficheExemple();
  f2.date = "2026-08-30";
  const grille = grilleHeures([f1, f2]);
  assert.equal(grille.length, 2);
  const sami = grille.find((l) => l.nom === "Sami");
  assert.equal(sami?.parJour["2026-08-29"], 840);
  assert.equal(sami?.parJour["2026-08-30"], 840);
  assert.equal(sami?.total, 1680);
  assert.equal(sami?.acomptes, 40);
  const lina = grille.find((l) => l.nom === "Lina");
  assert.deepEqual(lina?.joursIncomplets, ["2026-08-29", "2026-08-30"]);
});
