import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCES, egaux, jetonAcces } from "@/lib/acces";

/**
 * Protège tout le site par un code d'accès (variable ACCES_MOT_DE_PASSE).
 * - Sans variable en local : aucun blocage (développement).
 * - Sans variable sur Vercel : le site refuse de répondre, pour ne jamais exposer la clé API par oubli.
 */
export async function middleware(req: NextRequest) {
  const motDePasse = process.env.ACCES_MOT_DE_PASSE;

  if (!motDePasse) {
    if (process.env.VERCEL) {
      return new NextResponse("Configuration incomplète : ACCES_MOT_DE_PASSE n'est pas défini.", { status: 503 });
    }
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;
  if (pathname === "/connexion" || pathname === "/api/connexion") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_ACCES)?.value ?? "";
  if (egaux(cookie, await jetonAcces(motDePasse))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ erreur: "Accès non autorisé : connectez-vous." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = `?suite=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
