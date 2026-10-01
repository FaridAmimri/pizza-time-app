import { PLATEFORMES } from "./constantes";
import type { Fiche, Pointage } from "./types";

export function pointageVide(): Pointage {
  return { nom: "", acompte: null, matin: { da: null, fs: null }, soir: { da: null, fs: null } };
}

export function ficheVide(date = new Date().toISOString().slice(0, 10)): Fiche {
  return {
    date,
    restaurant: null,
    responsable: null,
    matin: { totalEnBon: null, totalEnCaisse: null, especes: null, ticketRestaurant: null, carteBancaire: null },
    commandesInternet: PLATEFORMES.map((plateforme) => ({ plateforme, nbCommandes: null, modePaiement: null, total: null })),
    soir: { especes: null, ticketRestaurant: null, carteBancaire: null, chequeVacance: null, dishopEnLigne: null },
    achats: null,
    commandesAnnulees: null,
    totauxEcrits: { totalEnBon: null, totalEnCaisse: null },
    employes: Array.from({ length: 6 }, pointageVide),
  };
}

/** Retire les lignes employés totalement vides avant enregistrement. */
export function nettoyerFiche(fiche: Fiche): Fiche {
  const utile = (e: Pointage) =>
    e.nom.trim() !== "" || e.acompte !== null || e.matin.da || e.matin.fs || e.soir.da || e.soir.fs;
  return { ...fiche, employes: fiche.employes.filter(utile) };
}
