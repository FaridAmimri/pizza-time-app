"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageMois } from "@/components/PageMois";
import { dateFr, jourCourt } from "@/lib/format";
import { useMois } from "@/lib/mois-context";
import { combiner, useFichesDuMois, usePhotosDuMois } from "@/lib/use-fiches";

export default function PagePhotos() {
  const { mois } = useMois();
  const fiches = useFichesDuMois(mois);
  const photos = usePhotosDuMois(mois);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);

  const avecPhoto = new Set(photos.dates);
  const sansPhoto = fiches.fiches.filter((f) => !avecPhoto.has(f.date)).length;

  return (
    <PageMois titre="Photos archivées" etat={combiner(fiches.etat, photos.etat)}>
      {photos.dates.length === 0 ? (
        <p className="vide">
          Aucune photo archivée pour ce mois. Chaque fiche <Link href="/scanner">scannée</Link> est enregistrée avec sa photo.
        </p>
      ) : (
        <>
          <ul className="photos-grille">
            {photos.dates.map((date) => (
              <li key={date}>
                <button type="button" className="photo-carte" onClick={() => setOuverte(date)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${date}`} alt={`Photo de la fiche du ${dateFr(date)}`} loading="lazy" />
                  <span>{jourCourt(date)}</span>
                </button>
              </li>
            ))}
          </ul>
          {sansPhoto > 0 && (
            <p className="note">
              {sansPhoto} fiche{sansPhoto > 1 ? "s" : ""} de ce mois {sansPhoto > 1 ? "n'ont" : "n'a"} pas de photo (saisie à la main).
            </p>
          )}
        </>
      )}

      <dialog
        ref={dialogue}
        className="dialogue"
        aria-label="Photo de la fiche"
        onClose={() => setOuverte(null)}
        onClick={(e) => e.target === e.currentTarget && setOuverte(null)}
      >
        {ouverte && (
          <div className="dialogue-corps">
            <h2>Fiche du {dateFr(ouverte)}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${ouverte}`} alt={`Photo de la fiche du ${dateFr(ouverte)}`} />
            <div className="actions">
              <Link className="bouton" href={`/journal/${ouverte}`}>
                Ouvrir la fiche
              </Link>
              <a className="bouton secondaire" href={`/api/photos/${ouverte}?telecharger=1`}>
                Télécharger la photo
              </a>
              <button type="button" className="bouton secondaire" onClick={() => setOuverte(null)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </dialog>
    </PageMois>
  );
}
