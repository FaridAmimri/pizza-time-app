/**
 * Stockage en ligne : base PostgreSQL (Neon). Une ligne par jour, la fiche en JSON
 * et la photo en texte base64 (suffisant pour la démo ; pour la production, voir
 * DEPLOIEMENT.md pour déplacer les photos vers un stockage de fichiers).
 * Activé automatiquement quand la variable DATABASE_URL est définie (voir depot.ts).
 */
import { neon } from "@neondatabase/serverless";
import type { Fiche } from "@/domain/types";
import type { DepotFiches } from "./depot";

type Requete = ReturnType<typeof neon>;

let requete: Requete | null = null;
let tablePrete: Promise<void> | null = null;

/** Connexion à la base, avec création de la table au premier appel. */
async function base(): Promise<Requete> {
  if (!requete) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant : renseignez l'adresse de la base Neon.");
    requete = neon(url);
  }
  const sql = requete;
  if (!tablePrete) {
    tablePrete = sql`
      create table if not exists fiches (
        date text primary key,
        data jsonb not null,
        photo text,
        modifie_le timestamptz not null default now()
      )
    `.then(
      () => undefined,
      (e) => {
        tablePrete = null; // on réessaiera à la prochaine requête
        throw e;
      },
    );
  }
  await tablePrete;
  return sql;
}

export const depotPostgres: DepotFiches = {
  async lister(mois) {
    const sql = await base();
    const lignes = (
      mois
        ? await sql`select data from fiches where date like ${mois + "%"} order by date`
        : await sql`select data from fiches order by date`
    ) as { data: Fiche }[];
    return lignes.map((l) => l.data);
  },

  async sauvegarder(fiche, photoJpeg) {
    const sql = await base();
    const donnees = JSON.stringify(fiche);
    if (photoJpeg) {
      await sql`
        insert into fiches (date, data, photo)
        values (${fiche.date}, ${donnees}::jsonb, ${photoJpeg.toString("base64")})
        on conflict (date) do update
          set data = excluded.data, photo = excluded.photo, modifie_le = now()
      `;
    } else {
      // Sans nouvelle photo, on garde celle déjà archivée.
      await sql`
        insert into fiches (date, data)
        values (${fiche.date}, ${donnees}::jsonb)
        on conflict (date) do update
          set data = excluded.data, modifie_le = now()
      `;
    }
  },

  async supprimer(date) {
    const sql = await base();
    await sql`delete from fiches where date = ${date}`;
  },

  async trouver(date) {
    const sql = await base();
    const lignes = (await sql`select data from fiches where date = ${date}`) as { data: Fiche }[];
    return lignes[0]?.data ?? null;
  },

  async datesAvecPhoto(mois) {
    const sql = await base();
    const lignes = (
      mois
        ? await sql`select date from fiches where photo is not null and date like ${mois + "%"} order by date`
        : await sql`select date from fiches where photo is not null order by date`
    ) as { date: string }[];
    return lignes.map((l) => l.date);
  },

  async photo(date) {
    const sql = await base();
    const lignes = (await sql`select photo from fiches where date = ${date}`) as { photo: string | null }[];
    const b64 = lignes[0]?.photo;
    return b64 ? Buffer.from(b64, "base64") : null;
  },
};
