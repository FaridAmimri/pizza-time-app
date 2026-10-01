import { cookies } from "next/headers";
import { COOKIE_ACCES, egaux, jetonAcces } from "@/lib/acces";

export async function POST(req: Request) {
  const attendu = process.env.ACCES_MOT_DE_PASSE;
  if (!attendu) return Response.json({ ok: true }); // pas de protection configurée (local)

  const { motDePasse } = await req.json().catch(() => ({ motDePasse: "" }));
  if (typeof motDePasse !== "string" || !egaux(motDePasse, attendu)) {
    await new Promise((r) => setTimeout(r, 800)); // ralentit les essais au hasard
    return Response.json({ erreur: "Code d'accès incorrect." }, { status: 401 });
  }

  (await cookies()).set(COOKIE_ACCES, await jetonAcces(attendu), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}
