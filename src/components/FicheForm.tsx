"use client";

import { heuresEmploye } from "@/domain/calculs";
import { pointageVide } from "@/domain/fiche-vide";
import type { Fiche } from "@/domain/types";
import { formatHeures } from "@/lib/format";
import { getAt, setAt } from "@/lib/path";
import { Champ } from "./Champ";
import { Controle } from "./Controle";

type Props = {
  fiche: Fiche;
  doutes: string[];
  onChange: (fiche: Fiche) => void;
  /** Appelé quand l'utilisateur corrige un champ : le jaune disparaît. */
  onVu: (chemin: string) => void;
  /** Date non modifiable (fiche déjà enregistrée : sa photo archivée est liée à cette date). */
  dateFigee?: boolean;
};

export function FicheForm({ fiche, doutes, onChange, onVu, dateFigee }: Props) {
  /** Relie un champ à son chemin dans la fiche (valeur, modification, surlignage). */
  const lie = (chemin: string) => ({
    value: getAt(fiche, chemin) as string | number | null,
    douteux: doutes.includes(chemin),
    onChange: (v: string | number | null) => {
      onChange(setAt(fiche, chemin, v));
      onVu(chemin);
    },
  });

  const retirerEmploye = (i: number) => {
    onChange({ ...fiche, employes: fiche.employes.filter((_, j) => j !== i) });
    onVu("employes"); // les index changent : on efface les surlignages de cette liste
  };

  return (
    <div>
      <section className="bloc">
        <h2>En-tête</h2>
        <div className="bloc-corps grille">
          <Champ label="Date (AAAA-MM-JJ)" type="texte" disabled={dateFigee} {...lie("date")} />
          <Champ label="Restaurant" type="texte" {...lie("restaurant")} />
          <Champ label="Responsable" type="texte" {...lie("responsable")} />
        </div>
      </section>

      <section className="bloc">
        <h2>Matin</h2>
        <div className="bloc-corps grille">
          <Champ label="Espèces (€)" type="montant" {...lie("matin.especes")} />
          <Champ label="Ticket restaurant (€)" type="montant" {...lie("matin.ticketRestaurant")} />
          <Champ label="Carte bancaire (€)" type="montant" {...lie("matin.carteBancaire")} />
          <Champ label="Total en bon (€)" type="montant" {...lie("matin.totalEnBon")} />
          <Champ label="Total en caisse écrit (€)" type="montant" {...lie("matin.totalEnCaisse")} />
        </div>
      </section>

      <section className="bloc">
        <h2>Commandes internet déjà réglées</h2>
        <div className="bloc-corps">
          {fiche.commandesInternet.map((c, i) => (
            <div className="employe" key={c.plateforme}>
              <strong>{c.plateforme}</strong>
              <div className="grille">
                <Champ label="Commandes" type="entier" {...lie(`commandesInternet.${i}.nbCommandes`)} />
                <Champ label="Mode de paiement" type="texte" {...lie(`commandesInternet.${i}.modePaiement`)} />
                <Champ label="Total (€)" type="montant" {...lie(`commandesInternet.${i}.total`)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bloc">
        <h2>Soir</h2>
        <div className="bloc-corps grille">
          <Champ label="Espèces (€)" type="montant" {...lie("soir.especes")} />
          <Champ label="Ticket restaurant (€)" type="montant" {...lie("soir.ticketRestaurant")} />
          <Champ label="Carte bancaire (€)" type="montant" {...lie("soir.carteBancaire")} />
          <Champ label="Chèque vacances (€)" type="montant" {...lie("soir.chequeVacance")} />
          <Champ label="Dishop en ligne (€)" type="montant" {...lie("soir.dishopEnLigne")} />
        </div>
      </section>

      <section className="bloc">
        <h2>Achats, annulations et totaux écrits</h2>
        <div className="bloc-corps grille">
          <Champ label="Achats (€)" type="montant" {...lie("achats")} />
          <Champ label="Commandes annulées" type="entier" {...lie("commandesAnnulees")} />
          <Champ label="Total en bon écrit (€)" type="montant" {...lie("totauxEcrits.totalEnBon")} />
          <Champ label="Total en caisse écrit (€)" type="montant" {...lie("totauxEcrits.totalEnCaisse")} />
        </div>
      </section>

      <section className="bloc">
        <h2>Heures des employés</h2>
        <div className="bloc-corps">
          {fiche.employes.map((e, i) => {
            const h = heuresEmploye(e);
            return (
              <div className="employe" key={i}>
                <div className="employe-tete">
                  <Champ label="Nom" type="texte" {...lie(`employes.${i}.nom`)} />
                  <Champ label="Acompte ou conso (€)" type="montant" {...lie(`employes.${i}.acompte`)} />
                </div>
                <div className="grille">
                  <Champ label="Matin : arrivée" type="heure" {...lie(`employes.${i}.matin.da`)} />
                  <Champ label="Matin : sortie" type="heure" {...lie(`employes.${i}.matin.fs`)} />
                  <Champ label="Soir : arrivée" type="heure" {...lie(`employes.${i}.soir.da`)} />
                  <Champ label="Soir : sortie" type="heure" {...lie(`employes.${i}.soir.fs`)} />
                </div>
                <p className="resume">
                  Matin {formatHeures(h.matin)} · Soir {formatHeures(h.soir)} · Journée <strong>{formatHeures(h.journee)}</strong>
                  {h.incomplet && <span className="ecart-ko"> · Une heure est manquante</span>}
                </p>
                <button type="button" className="lien" onClick={() => retirerEmploye(i)}>
                  Retirer cet employé
                </button>
              </div>
            );
          })}
          <button type="button" className="bouton secondaire" onClick={() => onChange({ ...fiche, employes: [...fiche.employes, pointageVide()] })}>
            Ajouter un employé
          </button>
        </div>
      </section>

      <Controle fiche={fiche} />
    </div>
  );
}
