import type { EtatChargement } from "@/lib/use-fiches";
import { SelecteurMois } from "./SelecteurMois";

type Props = {
  titre: string;
  etat: EtatChargement;
  /** Boutons placés à côté du choix du mois (export, etc.). */
  actions?: React.ReactNode;
  children: React.ReactNode;
};

/** Cadre commun des onglets qui travaillent sur un mois : titre, choix du mois, chargement, erreur. */
export function PageMois({ titre, etat, actions, children }: Props) {
  return (
    <>
      <h1>{titre}</h1>
      <SelecteurMois>{actions}</SelecteurMois>
      {etat === "erreur" && (
        <p className="alerte" role="alert">
          Les données n'ont pas pu être chargées. Rechargez la page ; si le problème continue, vérifiez que l'application tourne.
        </p>
      )}
      {(etat === "attente" || etat === "chargement") && (
        <p className="intro" role="status">
          Chargement en cours.
        </p>
      )}
      {etat === "pret" && children}
    </>
  );
}
