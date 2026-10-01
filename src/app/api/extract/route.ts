import { extraireFiche } from "@/services/extraction";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ erreur: "Clé API manquante : renseignez ANTHROPIC_API_KEY dans .env.local." }, { status: 500 });
  }
  try {
    const { image, mediaType } = await req.json();
    const fiche = await extraireFiche(image, mediaType ?? "image/jpeg");
    return Response.json(fiche);
  } catch (e) {
    console.error("Extraction échouée :", e);
    return Response.json(
      { erreur: "La fiche n'a pas pu être lue. Reprenez la photo (à plat, bien éclairée) ou saisissez à la main." },
      { status: 500 },
    );
  }
}
