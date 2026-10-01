import { recapMois } from "@/domain/calculs";
import { depot } from "@/services/depot";
import { recapVersCsv } from "@/services/export-csv";

export async function GET(req: Request) {
  const mois = new URL(req.url).searchParams.get("mois") ?? "";
  if (!/^\d{4}-\d{2}$/.test(mois)) return Response.json({ erreur: "Mois invalide" }, { status: 400 });
  const csv = recapVersCsv(mois, recapMois(await depot.lister(mois)));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bilan-${mois}.csv"`,
    },
  });
}
