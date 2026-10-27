/** Données de test partagées : une fiche réaliste et cohérente (total calculé = total écrit = 625 €). */
import { ficheVide } from "@/domain/fiche-vide";
import type { Extraction, Fiche } from "@/domain/types";

export function ficheExemple(date = "2026-08-29"): Fiche {
  const f = ficheVide(date);
  f.restaurant = "Pizza Time Test";
  f.responsable = "Nadia";
  f.matin = { totalEnBon: null, totalEnCaisse: 170, especes: 100, ticketRestaurant: 20, carteBancaire: 50 };
  f.soir = { especes: 200, ticketRestaurant: 30, carteBancaire: 150, chequeVacance: 10, dishopEnLigne: 40 };
  f.commandesInternet[1] = { plateforme: "Deliveroo", nbCommandes: 3, modePaiement: "CB", total: 45.5 };
  f.achats = 15;
  f.commandesAnnulees = 1;
  f.totauxEcrits = { totalEnBon: 12, totalEnCaisse: 625 };
  f.employes = [
    { nom: "Sami", acompte: 20, matin: { da: "10:00", fs: "14:30" }, soir: { da: "18:00", fs: "00:30" } },
    { nom: "Lina", acompte: null, matin: { da: "11:00", fs: "14:00" }, soir: { da: null, fs: null } },
  ];
  return f;
}

/** Ce que renverrait Claude pour la fiche d'exemple, avec un champ signalé comme douteux. */
export function extractionExemple(): Extraction {
  return { ...ficheExemple(), doutes: ["soir.especes"] };
}
