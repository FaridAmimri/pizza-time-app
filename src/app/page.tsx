"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageMois } from "@/components/PageMois";
import { alertes, joursDuMois, joursSansFiche, recapMois } from "@/domain/calculs";
import { aujourdhui, dateFr, eur, formatHeures, jourCourt } from "@/lib/format";
import { useMois } from "@/lib/mois-context";
import { useFichesDuMois } from "@/lib/use-fiches";

export default function PageVueEnsemble() {
  const { mois } = useMois();
  const { fiches, etat } = useFichesDuMois(mois);

  const bilan = useMemo(() => {
    if (!mois) return null;
    const aujourdhuiIso = aujourdhui();
    const recap = recapMois(fiches);
    return {
      recap,
      alertes: alertes(fiches),
      manquants: joursSansFiche(mois, fiches, aujourdhuiIso),
      joursEcoules: joursDuMois(mois).filter((j) => j <= aujourdhuiIso).length,
      minutesEquipe: recap.employes.reduce((s, e) => s + e.journee, 0),
    };
  }, [fiches, mois]);

  const exporter = fiches.length > 0 && (
    <a className="bouton secondaire" href={`/api/export?mois=${mois}`}>
      Télécharger pour Excel
    </a>
  );

  return (
    <PageMois titre="Vue d'ensemble" etat={etat} actions={exporter}>
      {bilan && fiches.length === 0 && (
        <p className="vide">
          Aucune fiche enregistrée pour ce mois. <Link href="/scanner">Scannez une fiche</Link> pour commencer.
        </p>
      )}

      {bilan && fiches.length > 0 && (
        <>
          <dl className="kpis">
            <div className="kpi">
              <dt>Fiches saisies</dt>
              <dd>
                <span className="kpi-valeur">{bilan.recap.nbFiches}</span>
                <span className="kpi-detail">
                  sur {bilan.joursEcoules} jour{bilan.joursEcoules > 1 ? "s" : ""} écoulé{bilan.joursEcoules > 1 ? "s" : ""}
                </span>
              </dd>
            </div>
            <div className="kpi">
              <dt>Total en caisse</dt>
              <dd>
                <span className="kpi-valeur">{eur(bilan.recap.recettes.totalEnCaisse)}</span>
                <span className="kpi-detail">sur les fiches saisies</span>
              </dd>
            </div>
            <div className="kpi">
              <dt>Heures de l'équipe</dt>
              <dd>
                <span className="kpi-valeur">{formatHeures(bilan.minutesEquipe)}</span>
                <span className="kpi-detail">
                  {bilan.recap.employes.length} employé{bilan.recap.employes.length > 1 ? "s" : ""}
                </span>
              </dd>
            </div>
            <div className={bilan.alertes.length > 0 ? "kpi kpi-attention" : "kpi"}>
              <dt>À vérifier</dt>
              <dd>
                <span className="kpi-valeur">{bilan.alertes.length}</span>
                <span className="kpi-detail">{bilan.alertes.length > 0 ? "écart ou heure manquante" : "rien à signaler"}</span>
              </dd>
            </div>
          </dl>

          <section className="bloc">
            <h2>À vérifier</h2>
            <div className="bloc-corps">
              {bilan.alertes.length === 0 ? (
                <p className="ok">Les totaux correspondent et toutes les heures sont renseignées.</p>
              ) : (
                <ul className="liste">
                  {bilan.alertes.map((a) => (
                    <li key={`${a.type}-${a.date}`}>
                      <Link href={`/journal/${a.date}`}>{dateFr(a.date)}</Link>
                      {a.type === "ecart-caisse"
                        ? ` : écart de ${eur(a.ecart)} entre le total calculé et le total écrit sur la fiche.`
                        : ` : une heure d'arrivée ou de sortie manque pour ${a.employes.join(", ")}.`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bloc">
            <h2>Jours sans fiche</h2>
            <div className="bloc-corps">
              {bilan.manquants.length === 0 ? (
                <p className="ok">Toutes les fiches des jours écoulés sont saisies.</p>
              ) : (
                <>
                  <ul className="puces">
                    {bilan.manquants.map((jour) => (
                      <li className="puce" key={jour}>
                        {jourCourt(jour)}
                      </li>
                    ))}
                  </ul>
                  <p className="note">Les jours de fermeture apparaissent aussi dans cette liste.</p>
                </>
              )}
            </div>
          </section>

          <section className="bloc">
            <h2>Recettes</h2>
            <table className="tableau">
              <tbody>
                <tr><td>Espèces</td><td className="nombre">{eur(bilan.recap.recettes.especes)}</td></tr>
                <tr><td>Tickets restaurant</td><td className="nombre">{eur(bilan.recap.recettes.ticketRestaurant)}</td></tr>
                <tr><td>Cartes bancaires</td><td className="nombre">{eur(bilan.recap.recettes.carteBancaire)}</td></tr>
                <tr><td>Chèques vacances</td><td className="nombre">{eur(bilan.recap.recettes.chequeVacance)}</td></tr>
                <tr><td>Dishop en ligne</td><td className="nombre">{eur(bilan.recap.recettes.dishopEnLigne)}</td></tr>
                <tr><td>Achats</td><td className="nombre">{eur(bilan.recap.recettes.achats)}</td></tr>
                <tr><td>Acomptes</td><td className="nombre">{eur(bilan.recap.recettes.acomptes)}</td></tr>
                <tr className="total"><td>Total en caisse</td><td className="nombre">{eur(bilan.recap.recettes.totalEnCaisse)}</td></tr>
                <tr><td>Total en bon</td><td className="nombre">{eur(bilan.recap.recettes.totalEnBon)}</td></tr>
              </tbody>
            </table>
          </section>

          <section className="bloc">
            <h2>Commandes internet</h2>
            <table className="tableau">
              <thead>
                <tr><th>Plateforme</th><th className="nombre">Commandes</th><th className="nombre">Total</th></tr>
              </thead>
              <tbody>
                {Object.entries(bilan.recap.plateformes).map(([nom, p]) => (
                  <tr key={nom}>
                    <td>{nom}</td>
                    <td className="nombre">{p.nbCommandes}</td>
                    <td className="nombre">{eur(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bilan.recap.commandesAnnulees > 0 && (
              <p className="bloc-corps">Commandes annulées sur le mois : {bilan.recap.commandesAnnulees}</p>
            )}
          </section>
        </>
      )}
    </PageMois>
  );
}
