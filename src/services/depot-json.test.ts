import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { utiliserDepotTemporaire } from "../../tests/depot-temporaire";
import { ficheExemple } from "../../tests/fixtures";
import { depotJson } from "./depot-json";

const { dossier } = utiliserDepotTemporaire();

describe("depotJson", () => {
  it("dossier vide : aucune fiche, aucune photo", async () => {
    expect(await depotJson.lister()).toEqual([]);
    expect(await depotJson.trouver("2026-08-29")).toBeNull();
    expect(await depotJson.datesAvecPhoto()).toEqual([]);
    expect(await depotJson.photo("2026-08-29")).toBeNull();
  });

  it("sauvegarder puis trouver : même fiche, écrite dans le bon dossier", async () => {
    await depotJson.sauvegarder(ficheExemple());
    expect(await depotJson.trouver("2026-08-29")).toEqual(ficheExemple());
    const brut = JSON.parse(await readFile(path.join(dossier(), "fiches.json"), "utf-8"));
    expect(Object.keys(brut)).toEqual(["2026-08-29"]);
  });

  it("une seule fiche par jour : la deuxième sauvegarde remplace la première", async () => {
    await depotJson.sauvegarder(ficheExemple());
    const corrigee = { ...ficheExemple(), achats: 99 };
    await depotJson.sauvegarder(corrigee);
    expect(await depotJson.lister()).toEqual([corrigee]);
  });

  it("lister : filtre par mois et trie par date", async () => {
    await depotJson.sauvegarder(ficheExemple("2026-09-01"));
    await depotJson.sauvegarder(ficheExemple("2026-08-30"));
    await depotJson.sauvegarder(ficheExemple("2026-08-02"));
    expect((await depotJson.lister("2026-08")).map((f) => f.date)).toEqual(["2026-08-02", "2026-08-30"]);
    expect(await depotJson.lister()).toHaveLength(3);
  });

  it("photo : archivée avec la fiche, puis supprimée avec elle", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff]);
    await depotJson.sauvegarder(ficheExemple(), jpeg);
    expect(await depotJson.photo("2026-08-29")).toEqual(jpeg);
    expect(await depotJson.datesAvecPhoto("2026-08")).toEqual(["2026-08-29"]);
    expect(await depotJson.datesAvecPhoto("2026-09")).toEqual([]);

    await depotJson.supprimer("2026-08-29");
    expect(await depotJson.trouver("2026-08-29")).toBeNull();
    expect(await depotJson.photo("2026-08-29")).toBeNull();
  });

  it("photo : refuse un chemin qui n'est pas une date (pas de sortie du dossier)", async () => {
    expect(await depotJson.photo("../../etc/passwd")).toBeNull();
  });
});
