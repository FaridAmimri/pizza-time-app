/**
 * Stockage prototype : un fichier JSON dans ./data (une fiche par jour, un seul restaurant).
 * La variable DOSSIER_DONNEES permet de changer de dossier (utilisée par les tests, pour ne pas toucher aux vraies données).
 */
import { promises as fs } from "fs";
import path from "path";
import type { Fiche } from "@/domain/types";
import type { DepotFiches } from "./depot";

// Lus à chaque appel (et non au chargement du module) pour que les tests puissent changer de dossier.
const dossier = () => process.env.DOSSIER_DONNEES ?? path.join(process.cwd(), "data");
const fichier = () => path.join(dossier(), "fiches.json");
const photos = () => path.join(dossier(), "photos");
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Chemin de la photo d'un jour. Refuse tout ce qui n'est pas une date, pour ne jamais sortir du dossier. */
const cheminPhoto = (date: string): string | null => (JOUR.test(date) ? path.join(photos(), `${date}.jpg`) : null);

async function lireTout(): Promise<Record<string, Fiche>> {
  try {
    return JSON.parse(await fs.readFile(fichier(), "utf-8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

async function ecrireTout(data: Record<string, Fiche>) {
  await fs.mkdir(dossier(), { recursive: true });
  await fs.writeFile(fichier(), JSON.stringify(data, null, 2), "utf-8");
}

export const depotJson: DepotFiches = {
  async lister(mois) {
    const toutes = Object.values(await lireTout());
    return toutes.filter((f) => !mois || f.date.startsWith(mois)).sort((a, b) => a.date.localeCompare(b.date));
  },
  async sauvegarder(fiche, photoJpeg) {
    const data = await lireTout();
    data[fiche.date] = fiche;
    await ecrireTout(data);
    if (photoJpeg) {
      await fs.mkdir(photos(), { recursive: true });
      await fs.writeFile(path.join(photos(), `${fiche.date}.jpg`), photoJpeg);
    }
  },
  async supprimer(date) {
    const data = await lireTout();
    delete data[date];
    await ecrireTout(data);
    const photo = cheminPhoto(date);
    if (photo) await fs.rm(photo, { force: true });
  },
  async trouver(date) {
    return (await lireTout())[date] ?? null;
  },
  async datesAvecPhoto(mois) {
    let fichiers: string[];
    try {
      fichiers = await fs.readdir(photos());
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
    return fichiers
      .filter((nom) => /^\d{4}-\d{2}-\d{2}\.jpg$/.test(nom))
      .map((nom) => nom.slice(0, 10))
      .filter((date) => !mois || date.startsWith(mois))
      .sort();
  },
  async photo(date) {
    const chemin = cheminPhoto(date);
    if (!chemin) return null;
    try {
      return await fs.readFile(chemin);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  },
};
