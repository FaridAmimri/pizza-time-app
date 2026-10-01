import { depot } from "@/services/depot";

/** Photo archivée d'un jour : /api/photos/2026-08-29 (ajouter ?telecharger=1 pour la télécharger). */
export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ erreur: "Date invalide" }, { status: 400 });

  const photo = await depot.photo(date);
  if (!photo) return Response.json({ erreur: "Photo introuvable" }, { status: 404 });

  const telecharger = new URL(req.url).searchParams.get("telecharger") === "1";
  return new Response(new Uint8Array(photo), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=300",
      ...(telecharger && { "Content-Disposition": `attachment; filename="fiche-${date}.jpg"` }),
    },
  });
}
