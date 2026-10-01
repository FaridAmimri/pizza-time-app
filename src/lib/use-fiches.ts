"use client";

/** Chargement des données d'un mois pour les onglets. Un seul endroit où l'on appelle l'API. */
import { useEffect, useState } from "react";
import type { Fiche } from "@/domain/types";

export type EtatChargement = "attente" | "chargement" | "pret" | "erreur";

/** Résume plusieurs chargements en un seul état. */
export function combiner(...etats: EtatChargement[]): EtatChargement {
  if (etats.includes("erreur")) return "erreur";
  if (etats.includes("attente")) return "attente";
  if (etats.includes("chargement")) return "chargement";
  return "pret";
}

function useListeDuMois<T>(url: (mois: string) => string, mois: string) {
  const [donnees, setDonnees] = useState<T[]>([]);
  const [etat, setEtat] = useState<EtatChargement>("attente");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!mois) return;
    let annule = false;
    setEtat("chargement");
    fetch(url(mois))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<T[]>;
      })
      .then((liste) => {
        if (annule) return;
        setDonnees(liste);
        setEtat("pret");
      })
      .catch(() => {
        if (!annule) setEtat("erreur");
      });
    return () => {
      annule = true;
    };
    // `url` est stable (fonction définie hors du composant) : seuls le mois et la version relancent le chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, version]);

  return { donnees, etat, setDonnees, recharger: () => setVersion((v) => v + 1) };
}

const urlFiches = (mois: string) => `/api/fiches?mois=${mois}`;
const urlPhotos = (mois: string) => `/api/photos?mois=${mois}`;

/** Fiches d'un mois, triées par date. */
export function useFichesDuMois(mois: string) {
  const { donnees, etat, setDonnees, recharger } = useListeDuMois<Fiche>(urlFiches, mois);
  return {
    fiches: donnees,
    etat,
    recharger,
    /** Retire une fiche de la liste affichée, sans recharger (après une suppression). */
    retirer: (date: string) => setDonnees((liste) => liste.filter((f) => f.date !== date)),
  };
}

/** Jours d'un mois qui ont une photo archivée. */
export function usePhotosDuMois(mois: string) {
  const { donnees, etat, recharger } = useListeDuMois<string>(urlPhotos, mois);
  return { dates: donnees, etat, recharger };
}
