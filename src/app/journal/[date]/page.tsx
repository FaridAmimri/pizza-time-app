"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FicheForm } from "@/components/FicheForm";
import { nettoyerFiche } from "@/domain/fiche-vide";
import type { Fiche } from "@/domain/types";
import { dateFr } from "@/lib/format";

type Etat = "chargement" | "pret" | "introuvable" | "erreur";

/** Ouvre une fiche enregistrée pour la relire ou la corriger. La date ne change pas : la photo archivée y est liée. */
export default function PageFiche() {
  const { date } = useParams<{ date: string }>();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [etat, setEtat] = useState<Etat>("chargement");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [photoPresente, setPhotoPresente] = useState(true);

  useEffect(() => {
    let annule = false;
    fetch(`/api/fiches?date=${date}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 400) return !annule && setEtat("introuvable");
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as Fiche;
        if (annule) return;
        setFiche(data);
        setEtat("pret");
      })
      .catch(() => {
        if (!annule) setEtat("erreur");
      });
    return () => {
      annule = true;
    };
  }, [date]);

  async function enregistrer() {
    if (!fiche) return;
    setMessage(null);
    const rep = await fetch("/api/fiches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fiche: nettoyerFiche(fiche) }),
    });
    if (!rep.ok) {
      const { erreur } = await rep.json().catch(() => ({ erreur: undefined }));
      setMessage({ ok: false, texte: erreur ?? "Les modifications n'ont pas pu être enregistrées." });
      return;
    }
    setMessage({ ok: true, texte: "Modifications enregistrées." });
  }

  if (etat === "chargement") {
    return (
      <p className="intro" role="status">
        Chargement en cours.
      </p>
    );
  }

  if (etat !== "pret" || !fiche) {
    return (
      <>
        <h1>{etat === "introuvable" ? "Fiche introuvable" : "Fiche indisponible"}</h1>
        <p className="intro">
          {etat === "introuvable"
            ? "Aucune fiche n'est enregistrée à cette date."
            : "La fiche n'a pas pu être chargée. Rechargez la page."}
        </p>
        <Link className="bouton secondaire" href="/journal">
          Retour au journal des feuilles
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Fiche du {dateFr(date)}</h1>
      <div className="verif">
        {photoPresente && (
          <div className="apercu">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${date}`} alt={`Photo de la fiche du ${dateFr(date)}`} onError={() => setPhotoPresente(false)} />
          </div>
        )}
        <div>
          <FicheForm fiche={fiche} doutes={[]} dateFigee onChange={setFiche} onVu={() => {}} />
          {message && (
            <p className={message.ok ? "ok" : "alerte"} role={message.ok ? "status" : "alert"}>
              {message.texte}
            </p>
          )}
          <div className="barre-action">
            <Link className="bouton secondaire" href="/journal">
              Retour au journal
            </Link>
            <button type="button" className="bouton" onClick={enregistrer}>
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
