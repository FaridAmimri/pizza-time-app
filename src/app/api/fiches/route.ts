import { FicheSchema } from "@/domain/types";
import { depot } from "@/services/depot";

const MOIS = /^\d{4}-\d{2}$/;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const date = params.get("date");
  if (date) {
    if (!JOUR.test(date)) return Response.json({ erreur: "Date invalide" }, { status: 400 });
    const fiche = await depot.trouver(date);
    return fiche ? Response.json(fiche) : Response.json({ erreur: "Fiche introuvable" }, { status: 404 });
  }

  const mois = params.get("mois") ?? undefined;
  if (mois && !MOIS.test(mois)) return Response.json({ erreur: "Mois invalide" }, { status: 400 });
  return Response.json(await depot.lister(mois));
}

export async function POST(req: Request) {
  const { fiche, photo } = await req.json();
  const valide = FicheSchema.safeParse(fiche);
  if (!valide.success || !JOUR.test(valide.data.date)) {
    return Response.json({ erreur: "Fiche invalide : vérifiez la date." }, { status: 400 });
  }
  await depot.sauvegarder(valide.data, photo ? Buffer.from(photo, "base64") : undefined);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!JOUR.test(date)) return Response.json({ erreur: "Date invalide" }, { status: 400 });
  await depot.supprimer(date);
  return Response.json({ ok: true });
}
