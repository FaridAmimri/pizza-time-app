"use client";

/**
 * Mois affiché dans les onglets. Il vit dans le layout : on change d'onglet sans perdre le mois choisi.
 * Il reste vide ("") jusqu'à l'affichage dans le navigateur, pour utiliser la date de l'utilisateur.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { aujourdhui } from "./format";

type ContexteMois = { mois: string; setMois: (mois: string) => void };

const MoisContext = createContext<ContexteMois>({ mois: "", setMois: () => {} });

export function MoisProvider({ children }: { children: React.ReactNode }) {
  const [mois, setMois] = useState("");

  useEffect(() => {
    setMois(aujourdhui().slice(0, 7));
  }, []);

  return <MoisContext.Provider value={{ mois, setMois }}>{children}</MoisContext.Provider>;
}

export const useMois = (): ContexteMois => useContext(MoisContext);
