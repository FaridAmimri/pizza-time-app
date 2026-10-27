import { describe, expect, it } from "vitest";
import { depotJson } from "@/services/depot-json";
import { utiliserDepotTemporaire } from "../../../../tests/depot-temporaire";
import { ficheExemple } from "../../../../tests/fixtures";
import { GET as photoDuJour } from "./[date]/route";
import { GET as listerPhotos } from "./route";

utiliserDepotTemporaire();

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const avecDate = (date: string) => ({ params: Promise.resolve({ date }) });

describe("GET /api/photos", () => {
  it("liste les jours qui ont une photo, mois invalide : 400", async () => {
    await depotJson.sauvegarder(ficheExemple(), JPEG);
    await depotJson.sauvegarder(ficheExemple("2026-08-30"));
    expect(await (await listerPhotos(new Request("http://localhost/api/photos?mois=2026-08"))).json()).toEqual(["2026-08-29"]);
    expect((await listerPhotos(new Request("http://localhost/api/photos?mois=x"))).status).toBe(400);
  });
});

describe("GET /api/photos/[date]", () => {
  it("renvoie l'image JPEG ; ?telecharger=1 ajoute le nom du fichier", async () => {
    await depotJson.sauvegarder(ficheExemple(), JPEG);

    const vue = await photoDuJour(new Request("http://localhost/api/photos/2026-08-29"), avecDate("2026-08-29"));
    expect(vue.headers.get("Content-Type")).toBe("image/jpeg");
    expect(vue.headers.get("Content-Disposition")).toBeNull();
    expect(Buffer.from(await vue.arrayBuffer())).toEqual(JPEG);

    const telechargement = await photoDuJour(
      new Request("http://localhost/api/photos/2026-08-29?telecharger=1"),
      avecDate("2026-08-29"),
    );
    expect(telechargement.headers.get("Content-Disposition")).toBe('attachment; filename="fiche-2026-08-29.jpg"');
  });

  it("photo absente : 404 ; date invalide : 400", async () => {
    expect((await photoDuJour(new Request("http://localhost/x"), avecDate("2026-08-29"))).status).toBe(404);
    expect((await photoDuJour(new Request("http://localhost/x"), avecDate("..%2F..%2Fetc"))).status).toBe(400);
  });
});
