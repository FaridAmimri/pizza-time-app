"use client";

import { useMemo } from "react";
import { PageMois } from "@/components/PageMois";
import { grilleHeures, joursDuMois, recapMois } from "@/domain/calculs";
import { dateLongue, eur, formatHCourt, formatHeures } from "@/lib/format";
import { useMois } from "@/lib/mois-context";
import { useFichesDuMois } from "@/lib/use-fiches";

export default function PageEquipe() {
  const { mois } = useMois();
  const { fiches, etat } = useFichesDuMois(mois);

  const donnees = useMemo(() => {
    if (!mois) return null;
    const jours = joursDuMois(mois);
    const grille = grilleHeures(fiches);
    return {
      jours,
      grille,
      recap: recapMois(fiches).employes,
      totalParJour: jours.map((j) => grille.reduce((s, l) => s + (l.parJour[j] ?? 0), 0)),
      totalMois: grille.reduce((s, l) => s + l.total, 0),
      totalAcomptes: grille.reduce((s, l) => s + l.acomptes, 0),
    };
  }, [fiches, mois]);

  const exporter = fiches.length > 0 && (
    <a className="bouton secondaire" href={`/api/export?mois=${mois}`}>
      Télécharger pour Excel
    </a>
  );

  return (
    <PageMois titre="Heures de l'équipe" etat={etat} actions={exporter}>
      {donnees && donnees.grille.length === 0 && <p className="vide">Aucune heure saisie pour ce mois.</p>}

      {donnees && donnees.grille.length > 0 && (
        <>
          <section className="bloc">
            <h2>Récapitulatif du mois</h2>
            <div className="defilement">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th className="nombre">Jours</th>
                    <th className="nombre">Matin</th>
                    <th className="nombre">Soir</th>
                    <th className="nombre">Total</th>
                    <th className="nombre">Acomptes</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.recap.map((e) => (
                    <tr key={e.nom}>
                      <td>{e.nom}</td>
                      <td className="nombre">{e.jours}</td>
                      <td className="nombre">{formatHeures(e.matin)}</td>
                      <td className="nombre">{formatHeures(e.soir)}</td>
                      <td className="nombre">
                        <strong>{formatHeures(e.journee)}</strong>
                      </td>
                      <td className="nombre">{eur(e.acomptes)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>Équipe</td>
                    <td className="nombre"></td>
                    <td className="nombre">{formatHeures(donnees.recap.reduce((s, e) => s + e.matin, 0))}</td>
                    <td className="nombre">{formatHeures(donnees.recap.reduce((s, e) => s + e.soir, 0))}</td>
                    <td className="nombre">{formatHeures(donnees.totalMois)}</td>
                    <td className="nombre">{eur(donnees.totalAcomptes)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bloc">
            <h2>Jour par jour</h2>
            <div className="defilement">
              <table className="grille-heures">
                <thead>
                  <tr>
                    <th scope="col">Employé</th>
                    {donnees.jours.map((j) => (
                      <th scope="col" key={j} title={dateLongue(j)}>
                        {Number(j.slice(8))}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.grille.map((l) => (
                    <tr key={l.nom}>
                      <th scope="row">{l.nom}</th>
                      {donnees.jours.map((j) => {
                        const minutes = l.parJour[j];
                        const incomplet = l.joursIncomplets.includes(j);
                        return (
                          <td key={j} className={incomplet ? "incomplet" : undefined}>
                            {minutes ? formatHCourt(minutes) : incomplet ? "?" : ""}
                          </td>
                        );
                      })}
                      <td>
                        <strong>{formatHCourt(l.total)}</strong>
                      </td>
                    </tr>
                  ))}
                  <tr className="total">
                    <th scope="row">Équipe</th>
                    {donnees.totalParJour.map((minutes, i) => (
                      <td key={donnees.jours[i]}>{minutes ? formatHCourt(minutes) : ""}</td>
                    ))}
                    <td>{formatHCourt(donnees.totalMois)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="bloc-corps note">
              Une case jaune signale une heure d'arrivée ou de sortie manquante : corrigez-la dans le journal des feuilles.
              Un « ? » indique que la durée du jour n'a pas pu être calculée.
            </p>
          </section>
        </>
      )}
    </PageMois>
  );
}
