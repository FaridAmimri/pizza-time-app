import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_ACCES, jetonAcces } from "@/lib/acces";
import { middleware } from "./middleware";

/** Le middleware reçoit une NextRequest : on la construit nous-mêmes, avec ou sans cookie. */
function requete(chemin: string, cookie?: string) {
  return new NextRequest(`http://localhost${chemin}`, cookie ? { headers: { cookie: `${COOKIE_ACCES}=${cookie}` } } : undefined);
}

/** NextResponse.next() se reconnaît à cet en-tête interne de Next. */
const laissePasser = (r: Response) => r.headers.get("x-middleware-next") === "1";

beforeEach(() => {
  vi.stubEnv("VERCEL", "");
});

describe("middleware sans ACCES_MOT_DE_PASSE", () => {
  beforeEach(() => vi.stubEnv("ACCES_MOT_DE_PASSE", ""));

  it("en local : tout est accessible", async () => {
    expect(laissePasser(await middleware(requete("/")))).toBe(true);
  });

  it("sur Vercel : le site refuse de répondre (503), pour ne jamais exposer la clé API", async () => {
    vi.stubEnv("VERCEL", "1");
    expect((await middleware(requete("/"))).status).toBe(503);
  });
});

describe("middleware avec ACCES_MOT_DE_PASSE", () => {
  beforeEach(() => vi.stubEnv("ACCES_MOT_DE_PASSE", "code-secret"));

  it("page sans cookie : redirection vers /connexion en gardant la page demandée", async () => {
    const reponse = await middleware(requete("/journal?mois=2026-08"));
    expect(reponse.status).toBe(307);
    const cible = new URL(reponse.headers.get("location")!);
    expect(cible.pathname).toBe("/connexion");
    expect(cible.searchParams.get("suite")).toBe("/journal?mois=2026-08");
  });

  it("API sans cookie : 401 en JSON (pas de redirection)", async () => {
    const reponse = await middleware(requete("/api/fiches"));
    expect(reponse.status).toBe(401);
    expect(await reponse.json()).toEqual({ erreur: "Accès non autorisé : connectez-vous." });
  });

  it("cookie faux ou mot de passe en clair dans le cookie : refusé", async () => {
    expect((await middleware(requete("/api/fiches", "n-importe-quoi"))).status).toBe(401);
    expect((await middleware(requete("/api/fiches", "code-secret"))).status).toBe(401);
  });

  it("bon cookie : accès autorisé", async () => {
    expect(laissePasser(await middleware(requete("/api/fiches", await jetonAcces("code-secret"))))).toBe(true);
  });

  it("page et API de connexion : toujours accessibles", async () => {
    expect(laissePasser(await middleware(requete("/connexion")))).toBe(true);
    expect(laissePasser(await middleware(requete("/api/connexion")))).toBe(true);
  });
});
