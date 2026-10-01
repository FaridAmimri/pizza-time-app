/**
 * Point d'entrée unique du stockage. Le reste du code n'utilise que `depot`.
 * Pour passer à PostgreSQL : écrire depot-postgres.ts qui respecte DepotFiches,
 * puis changer la ligne `export const depot` ci-dessous. Rien d'autre à modifier.
 */
import type { Fiche } from "@/domain/types";
import { depotJson } from "./depot-json";
import { depotPostgres } from "./depot-postgres";

export interface DepotFiches {
  /** Fiches d'un mois ("2026-08"), triées par date. Sans argument : toutes. */
  lister(mois?: string): Promise<Fiche[]>;
  /** Crée ou remplace la fiche de ce jour. */
  sauvegarder(fiche: Fiche, photoJpeg?: Buffer): Promise<void>;
  /** Supprime la fiche de ce jour et sa photo archivée. */
  supprimer(date: string): Promise<void>;
  /** La fiche de ce jour ("2026-08-29"), ou null si elle n'existe pas. */
  trouver(date: string): Promise<Fiche | null>;
  /** Jours ("AAAA-MM-JJ") qui ont une photo archivée, pour un mois ou pour tous. */
  datesAvecPhoto(mois?: string): Promise<string[]>;
  /** Contenu de la photo archivée de ce jour, ou null s'il n'y en a pas. */
  photo(date: string): Promise<Buffer | null>;
}

/** En ligne (DATABASE_URL définie) : base Neon. En local sans variable : fichiers dans ./data. */
export const depot: DepotFiches = process.env.DATABASE_URL ? depotPostgres : depotJson;
