"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageMois } from "@/components/PageMois";
import { ecartCaisse, heuresEmploye, minutesEquipe, totalEnCaisse } from "@/domain/calculs";
import type { Fiche } from "@/domain/types";
import { dateFr, dateLongue, eur, formatHeures, jourCourt } from "@/lib/format";
import { useMois } from "@/lib/mois-context";
import { combiner, useFichesDuMois, usePhotosDuMois } from "@/lib/use-fiches";

function Controle({ fiche }: { fiche: Fiche }) {
  const ecart = ecartCaisse(fiche);
  const heureManquante = fiche.employes.some((e) => heuresEmploye(e).incomplet);
  return (
    <>
      {ecart === null ? (
        "Pas de total écrit"
      ) : Math.abs(ecart) < 0.01 ? (
        <span className="ok">Correspond</span>
      ) : (
        <span className="ecart-ko">Écart {eur(ecart)}</span>
      )}
      {heureManquante && <span className="ecart-ko"> · Heure manquante</span>}
    </>
  );
}

export default function PageJournal() {
  const { mois } = useMois();
  const fiches = useFichesDuMois(mois);
  const photos = usePhotosDuMois(mois);
  const [erreur, setErreur] = useState<string | null>(null);

  const avecPhoto = useMemo(() => new Set(photos.dates), [photos.dates]);
  const recentesDabord = useMemo(() => [...fiches.fiches].reverse(), [fiches.fiches]);

  async function supprimer(date: string) {
    if (!confirm(`Supprimer la fiche du ${dateFr(date)} ? Sa photo archivée sera supprimée aussi.`)) return;
    setErreur(null);
    const rep = await fetch(`/api/fiches?date=${date}`, { method: "DELETE" });
    if (!rep.ok) {
      setErreur(`La fiche du ${dateFr(date)} n'a pas pu être supprimée.`);
      return;
    }
    fiches.retirer(date);
    photos.recharger();
  }

  return (
    <PageMois titre="Journal des feuilles" etat={combiner(fiches.etat, photos.etat)}>
      {erreur && (
        <p className="alerte" role="alert">
          {erreur}
        </p>
      )}

      {recentesDabord.length === 0 ? (
        <p className="vide">
          Aucune fiche enregistrée pour ce mois. <Link href="/scanner">Scannez une fiche</Link> pour commencer.
        </p>
      ) : (
        <section className="bloc">
          <h2>
            {recentesDabord.length} fiche{recentesDabord.length > 1 ? "s" : ""} ce mois-ci
          </h2>
          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Jour</th>
                  <th className="nombre">Total en caisse</th>
                  <th className="nombre">Heures de l'équipe</th>
                  <th>Contrôle</th>
                  <th>Photo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentesDabord.map((f) => (
                  <tr key={f.date}>
                    <td>
                      <time dateTime={f.date} title={dateLongue(f.date)}>
                        {jourCourt(f.date)}
                      </time>
                    </td>
                    <td className="nombre">{eur(totalEnCaisse(f))}</td>
                    <td className="nombre">{formatHeures(minutesEquipe(f))}</td>
                    <td>
                      <Controle fiche={f} />
                    </td>
                    <td>
                      {avecPhoto.has(f.date) ? (
                        <a href={`/api/photos/${f.date}`} target="_blank" rel="noreferrer">
                          Voir
                        </a>
                      ) : (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">Aucune photo</span>
                        </>
                      )}
                    </td>
                    <td>
                      <Link href={`/journal/${f.date}`}>Ouvrir</Link>{" "}
                      <button type="button" className="lien" onClick={() => supprimer(f.date)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageMois>
  );
}
