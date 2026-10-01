"use client";

import { useId } from "react";

type Props = {
  label: string;
  type: "texte" | "montant" | "entier" | "heure";
  value: string | number | null;
  onChange: (v: string | number | null) => void;
  douteux?: boolean;
  disabled?: boolean;
};

const ATTRIBUTS = {
  texte: { type: "text" },
  montant: { type: "number", step: "0.01", inputMode: "decimal" },
  entier: { type: "number", step: "1", inputMode: "numeric" },
  heure: { type: "time" },
} as const;

/** Champ de saisie unique pour toute l'appli. Jaune quand l'IA a un doute. */
export function Champ({ label, type, value, onChange, douteux, disabled }: Props) {
  const id = useId();
  return (
    <div className={douteux ? "champ douteux" : "champ"}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        {...ATTRIBUTS[type]}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (type === "texte") return onChange(v);
          if (v === "") return onChange(null);
          onChange(type === "heure" ? v : Number(v));
        }}
      />
      {douteux && <span className="note-douteux">À vérifier</span>}
    </div>
  );
}
