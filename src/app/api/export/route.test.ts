import { describe, expect, it } from "vitest";
import { depotJson } from "@/services/depot-json";
import { utiliserDepotTemporaire } from "../../../../tests/depot-temporaire";
import { ficheExemple } from "../../../../tests/fixtures";
import { GET } from "./route";

utiliserDepotTemporaire();

describe("GET /api/export", () => {
  it("renvoie le bilan du mois en CSV téléchargeable", async () => {
    await depotJson.sauvegarder(ficheExemple());
    const reponse = await GET(new Request("http://localhost/api/export?mois=2026-08"));

    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(reponse.headers.get("Content-Disposition")).toBe('attachment; filename="bilan-2026-08.csv"');
    const csv = await reponse.text();
    expect(csv).toContain('"Fiches saisies";1');
    expect(csv).toContain('"Total en caisse";625');
  });

  it("mois absent ou invalide : 400", async () => {
    expect((await GET(new Request("http://localhost/api/export"))).status).toBe(400);
    expect((await GET(new Request("http://localhost/api/export?mois=2026-8"))).status).toBe(400);
  });
});
