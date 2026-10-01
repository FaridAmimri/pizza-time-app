/**
 * Toutes les règles de calcul, en fonctions PURES (aucune dépendance à React,
 * à l'IA ou à la base). C'est ici qu'on modifie une formule, et c'est testé
 * dans calculs.test.ts.
 */
import type { Plateforme } from "./constantes";
import type { Fiche, Pointage } from "./types";

export const n = (v: number | null | undefined): number => v ?? 0;
export const arrondi = (v: number): number => Math.round(v * 100) / 100;

// ---------- Heures ----------

export function versMinutes(h: string | null): number | null {
  if (!h) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(h.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh > 23 || mm > 59 ? null : hh * 60 + mm;
}

export function formatHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Durée entre arrivée et sortie ; gère le passage de minuit (ex. 18:00 -> 00:30). */
export function dureeMinutes(da: string | null, fs: string | null): number {
  const a = versMinutes(da);
  const f = versMinutes(fs);
  if (a === null || f === null) return 0;
  return f >= a ? f - a : f + 1440 - a;
}

/** Vrai si une seule des deux heures est renseignée (oubli probable). */
export const plageIncomplete = (p: { da: string | null; fs: string | null }): boolean =>
  (versMinutes(p.da) === null) !== (versMinutes(p.fs) === null);

export function heuresEmploye(e: Pointage) {
  const matin = dureeMinutes(e.matin.da, e.matin.fs);
  const soir = dureeMinutes(e.soir.da, e.soir.fs);
  return { matin, soir, journee: matin + soir, incomplet: plageIncomplete(e.matin) || plageIncomplete(e.soir) };
}

// ---------- Caisse d'une journée ----------

export function sousTotaux(f: Fiche) {
  return {
    especes: arrondi(n(f.matin.especes) + n(f.soir.especes)),
    ticketRestaurant: arrondi(n(f.matin.ticketRestaurant) + n(f.soir.ticketRestaurant)),
    carteBancaire: arrondi(n(f.matin.carteBancaire) + n(f.soir.carteBancaire)),
    chequeVacance: arrondi(n(f.soir.chequeVacance)),
    dishopEnLigne: arrondi(n(f.soir.dishopEnLigne)),
  };
}

export const totalAcomptes = (f: Fiche): number => arrondi(f.employes.reduce((s, e) => s + n(e.acompte), 0));

/**
 * Formule imprimée en bas de la fiche :
 * espèces + ticket restaurant + carte bancaire + Dishop en ligne + acomptes + achats.
 * (le chèque vacances n'y figure pas : à confirmer avec le client)
 */
export function totalEnCaisse(f: Fiche): number {
  const s = sousTotaux(f);
  return arrondi(s.especes + s.ticketRestaurant + s.carteBancaire + s.dishopEnLigne + totalAcomptes(f) + n(f.achats));
}

/** Écart entre le total calculé et le total écrit à la main (null si rien d'écrit). */
export function ecartCaisse(f: Fiche): number | null {
  return f.totauxEcrits.totalEnCaisse === null ? null : arrondi(totalEnCaisse(f) - f.totauxEcrits.totalEnCaisse);
}

export function ecartMatin(f: Fiche): number | null {
  if (f.matin.totalEnCaisse === null) return null;
  return arrondi(n(f.matin.especes) + n(f.matin.ticketRestaurant) + n(f.matin.carteBancaire) - f.matin.totalEnCaisse);
}

// ---------- Bilan mensuel ----------

export type LigneEmploye = { nom: string; jours: number; matin: number; soir: number; journee: number; acomptes: number };

export type RecapMois = {
  nbFiches: number;
  recettes: {
    especes: number;
    ticketRestaurant: number;
    carteBancaire: number;
    chequeVacance: number;
    dishopEnLigne: number;
    achats: number;
    acomptes: number;
    totalEnCaisse: number;
    totalEnBon: number;
  };
  plateformes: Record<Plateforme, { nbCommandes: number; total: number }>;
  commandesAnnulees: number;
  employes: LigneEmploye[];
};

const cleEmploye = (nom: string) => nom.trim().toLowerCase().replace(/\s+/g, " ");

export function recapMois(fiches: Fiche[]): RecapMois {
  const recettes = {
    especes: 0, ticketRestaurant: 0, carteBancaire: 0, chequeVacance: 0,
    dishopEnLigne: 0, achats: 0, acomptes: 0, totalEnCaisse: 0, totalEnBon: 0,
  };
  const plateformes: RecapMois["plateformes"] = {
    "Just Eat": { nbCommandes: 0, total: 0 },
    Deliveroo: { nbCommandes: 0, total: 0 },
    "Uber Eats": { nbCommandes: 0, total: 0 },
    Dishop: { nbCommandes: 0, total: 0 },
  };
  const employes = new Map<string, LigneEmploye>();
  let commandesAnnulees = 0;

  for (const f of fiches) {
    const s = sousTotaux(f);
    recettes.especes += s.especes;
    recettes.ticketRestaurant += s.ticketRestaurant;
    recettes.carteBancaire += s.carteBancaire;
    recettes.chequeVacance += s.chequeVacance;
    recettes.dishopEnLigne += s.dishopEnLigne;
    recettes.achats += n(f.achats);
    recettes.acomptes += totalAcomptes(f);
    recettes.totalEnCaisse += totalEnCaisse(f);
    recettes.totalEnBon += n(f.totauxEcrits.totalEnBon);
    commandesAnnulees += n(f.commandesAnnulees);

    for (const c of f.commandesInternet) {
      plateformes[c.plateforme].nbCommandes += n(c.nbCommandes);
      plateformes[c.plateforme].total += n(c.total);
    }

    for (const e of f.employes) {
      if (e.nom.trim() === "") continue;
      const h = heuresEmploye(e);
      const cle = cleEmploye(e.nom);
      const l = employes.get(cle) ?? { nom: e.nom.trim(), jours: 0, matin: 0, soir: 0, journee: 0, acomptes: 0 };
      l.jours += h.journee > 0 ? 1 : 0;
      l.matin += h.matin;
      l.soir += h.soir;
      l.journee += h.journee;
      l.acomptes = arrondi(l.acomptes + n(e.acompte));
      employes.set(cle, l);
    }
  }

  for (const k of Object.keys(recettes) as (keyof typeof recettes)[]) recettes[k] = arrondi(recettes[k]);
  for (const p of Object.values(plateformes)) p.total = arrondi(p.total);

  return {
    nbFiches: fiches.length,
    recettes,
    plateformes,
    commandesAnnulees,
    employes: [...employes.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  };
}

// ---------- Vue d'ensemble, journal et heures de l'équipe ----------

/** Tous les jours d'un mois "AAAA-MM", au format "AAAA-MM-JJ". */
export function joursDuMois(mois: string): string[] {
  const [annee, m] = mois.split("-").map(Number);
  const nbJours = new Date(Date.UTC(annee, m, 0)).getUTCDate();
  return Array.from({ length: nbJours }, (_, i) => `${mois}-${String(i + 1).padStart(2, "0")}`);
}

/** Jours du mois sans fiche. Les jours après `aujourdhui` ("AAAA-MM-JJ") ne comptent pas. */
export function joursSansFiche(mois: string, fiches: Fiche[], aujourdhui: string): string[] {
  const saisis = new Set(fiches.map((f) => f.date));
  return joursDuMois(mois).filter((jour) => jour <= aujourdhui && !saisis.has(jour));
}

/** Minutes travaillées par toute l'équipe sur une fiche. */
export const minutesEquipe = (f: Fiche): number => f.employes.reduce((s, e) => s + heuresEmploye(e).journee, 0);

export type Alerte =
  | { type: "ecart-caisse"; date: string; ecart: number }
  | { type: "heure-manquante"; date: string; employes: string[] };

/** Ce qu'il faut vérifier dans le mois : écarts de caisse et heures d'arrivée ou de sortie oubliées. */
export function alertes(fiches: Fiche[]): Alerte[] {
  const liste: Alerte[] = [];
  for (const f of fiches) {
    const ecart = ecartCaisse(f);
    if (ecart !== null && Math.abs(ecart) >= 0.01) liste.push({ type: "ecart-caisse", date: f.date, ecart });

    const incomplets = f.employes.filter((e) => heuresEmploye(e).incomplet).map((e) => e.nom.trim() || "Sans nom");
    if (incomplets.length > 0) liste.push({ type: "heure-manquante", date: f.date, employes: incomplets });
  }
  return liste;
}

export type LigneGrille = {
  nom: string;
  /** Minutes travaillées, par jour ("AAAA-MM-JJ"). */
  parJour: Record<string, number>;
  /** Jours où une heure d'arrivée ou de sortie manque. */
  joursIncomplets: string[];
  total: number;
  acomptes: number;
};

/** Une ligne par employé, avec ses minutes jour par jour : la vue « feuille de pointage » du mois. */
export function grilleHeures(fiches: Fiche[]): LigneGrille[] {
  const lignes = new Map<string, LigneGrille>();
  for (const f of fiches) {
    for (const e of f.employes) {
      if (e.nom.trim() === "") continue;
      const h = heuresEmploye(e);
      const cle = cleEmploye(e.nom);
      const l = lignes.get(cle) ?? { nom: e.nom.trim(), parJour: {}, joursIncomplets: [], total: 0, acomptes: 0 };
      l.parJour[f.date] = (l.parJour[f.date] ?? 0) + h.journee;
      if (h.incomplet) l.joursIncomplets.push(f.date);
      l.total += h.journee;
      l.acomptes = arrondi(l.acomptes + n(e.acompte));
      lignes.set(cle, l);
    }
  }
  return [...lignes.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
