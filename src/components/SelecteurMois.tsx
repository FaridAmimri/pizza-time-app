"use client";

import { useId } from "react";
import { useMois } from "@/lib/mois-context";

/** Choix du mois, partagé par tous les onglets. Les boutons d'action de la page se glissent à droite. */
export function SelecteurMois({ children }: { children?: React.ReactNode }) {
  const id = useId();
  const { mois, setMois } = useMois();
  return (
    <div className="selecteur-mois">
      <div className="champ">
        <label htmlFor={id}>Mois</label>
        <input id={id} type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} />
      </div>
      {children}
    </div>
  );
}
