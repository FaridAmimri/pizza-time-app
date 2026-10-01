import { depot } from "@/services/depot";

/** Liste des jours qui ont une photo archivée : /api/photos?mois=2026-08 (sans paramètre : tous). */
export async function GET(req: Request) {
  const mois = new URL(req.url).searchParams.get("mois") ?? undefined;
  if (mois && !/^\d{4}-\d{2}$/.test(mois)) return Response.json({ erreur: "Mois invalide" }, { status: 400 });
  return Response.json(await depot.datesAvecPhoto(mois));
}
