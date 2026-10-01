/**
 * Modèle de données d'une fiche journalière.
 * UNE seule source de vérité : ce schéma sert à
 *  - décrire l'outil envoyé à Claude (extraction),
 *  - valider les données à l'enregistrement,
 *  - typer tout le code (type Fiche).
 * Pour ajouter un champ (ex. "pourboires"), on l'ajoute ici, puis dans le formulaire.
 */
import { z } from "zod";
import { PLATEFORMES } from "./constantes";

const montant = z.number().nullable().describe("Montant en euros, null si la case est vide");
const heure = z.string().nullable().describe("Heure au format HH:MM (24 h), null si vide");

export const CommandeInternetSchema = z.object({
  plateforme: z.enum(PLATEFORMES),
  nbCommandes: z.number().nullable(),
  modePaiement: z.string().nullable(),
  total: montant,
});

const PlageSchema = z.object({ da: heure.describe("DA : début / arrivée"), fs: heure.describe("FS : fin / sortie") });

export const PointageSchema = z.object({
  nom: z.string(),
  acompte: montant.describe("Acompte ou consommation"),
  matin: PlageSchema,
  soir: PlageSchema,
});

export const FicheSchema = z.object({
  date: z.string().describe("Date de la fiche au format AAAA-MM-JJ"),
  restaurant: z.string().nullable(),
  responsable: z.string().nullable(),
  matin: z.object({
    totalEnBon: montant,
    totalEnCaisse: montant,
    especes: montant,
    ticketRestaurant: montant,
    carteBancaire: montant,
  }),
  commandesInternet: z.array(CommandeInternetSchema),
  soir: z.object({
    especes: montant,
    ticketRestaurant: montant,
    carteBancaire: montant,
    chequeVacance: montant,
    dishopEnLigne: montant,
  }),
  achats: montant.describe("Achats détaillés"),
  commandesAnnulees: z.number().nullable(),
  totauxEcrits: z.object({
    totalEnBon: montant,
    totalEnCaisse: montant,
  }),
  employes: z.array(PointageSchema),
});

/** Ce que renvoie Claude : la fiche + la liste des champs incertains. */
export const ExtractionSchema = FicheSchema.extend({
  doutes: z
    .array(z.string())
    .describe('Chemins des champs illisibles ou incertains, ex. "soir.especes", "employes.2.soir.fs"'),
});

export type Fiche = z.infer<typeof FicheSchema>;
export type Pointage = z.infer<typeof PointageSchema>;
export type CommandeInternet = z.infer<typeof CommandeInternetSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;
