import { describe, expect, it } from "vitest";
import { utiliserDepotTemporaire } from "../../../../tests/depot-temporaire";
import { ficheExemple } from "../../../../tests/fixtures";
import { DELETE, GET, POST } from "./route";

/**
 * Test d'intégration : la route + la validation Zod + le vrai dépôt JSON (dans un dossier temporaire).
 * On appelle directement les fonctions exportées avec un objet Request standard, sans lancer de serveur.
 */
utiliserDepotTemporaire();

const url = (query = "") => `http://localhost/api/fiches${query}`;
const enregistrer = (corps: unknown) =>
  POST(new Request(url(), { method: "POST", body: JSON.stringify(corps), headers: { "Content-Type": "application/json" } }));

describe("POST /api/fiches", () => {
  it("fiche valide : enregistrée (200), puis relue par GET ?date=", async () => {
    const reponse = await enregistrer({ fiche: ficheExemple() });
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ ok: true });

    const relue = await GET(new Request(url("?date=2026-08-29")));
    expect(await relue.json()).toEqual(ficheExemple());
  });

  it("fiche invalide ou date mal formée : 400, rien n'est enregistré", async () => {
    expect((await enregistrer({ fiche: { ...ficheExemple(), achats: "15" } })).status).toBe(400);
    expect((await enregistrer({ fiche: ficheExemple("29/08/2026") })).status).toBe(400);
    expect(await (await GET(new Request(url()))).json()).toEqual([]);
  });

  it("avec photo en base64 : la photo est archivée", async () => {
    await enregistrer({ fiche: ficheExemple(), photo: Buffer.from("jpeg").toString("base64") });
    const { GET: listerPhotos } = await import("../photos/route");
    expect(await (await listerPhotos(new Request("http://localhost/api/photos?mois=2026-08"))).json()).toEqual(["2026-08-29"]);
  });
});

describe("GET /api/fiches", () => {
  it("?mois= : seulement les fiches du mois", async () => {
    await enregistrer({ fiche: ficheExemple("2026-08-29") });
    await enregistrer({ fiche: ficheExemple("2026-09-01") });
    const liste = await (await GET(new Request(url("?mois=2026-08")))).json();
    expect(liste.map((f: { date: string }) => f.date)).toEqual(["2026-08-29"]);
  });

  it("paramètres invalides : 400 ; fiche absente : 404", async () => {
    expect((await GET(new Request(url("?mois=août")))).status).toBe(400);
    expect((await GET(new Request(url("?date=2026-8-1")))).status).toBe(400);
    expect((await GET(new Request(url("?date=2026-08-01")))).status).toBe(404);
  });
});

describe("DELETE /api/fiches", () => {
  it("supprime la fiche du jour", async () => {
    await enregistrer({ fiche: ficheExemple() });
    expect((await DELETE(new Request(url("?date=2026-08-29"), { method: "DELETE" }))).status).toBe(200);
    expect((await GET(new Request(url("?date=2026-08-29")))).status).toBe(404);
  });

  it("date invalide : 400", async () => {
    expect((await DELETE(new Request(url("?date=../data"), { method: "DELETE" }))).status).toBe(400);
  });
});
