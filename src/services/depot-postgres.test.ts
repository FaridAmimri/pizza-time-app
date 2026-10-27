import { beforeEach, describe, expect, it, vi } from "vitest";
import { ficheExemple } from "../../tests/fixtures";

/**
 * Le client Neon est remplacé par un faux : aucune base, aucune DATABASE_URL réelle.
 * Le faux enregistre chaque requête SQL (texte + paramètres) et renvoie les lignes qu'on lui prépare.
 */
const { neon, requetes, reponses } = vi.hoisted(() => {
  const requetes: { sql: string; valeurs: unknown[] }[] = [];
  const reponses: (unknown[] | Error)[] = []; // une Error simule une requête en échec
  const sql = (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
    requetes.push({ sql: morceaux.join("$").replace(/\s+/g, " ").trim(), valeurs });
    const reponse = reponses.shift() ?? [];
    return reponse instanceof Error ? Promise.reject(reponse) : Promise.resolve(reponse);
  };
  return { neon: vi.fn(() => sql), requetes, reponses };
});

vi.mock("@neondatabase/serverless", () => ({ neon }));

/** Le module garde la connexion en mémoire : on le recharge à neuf pour chaque test. */
async function charger() {
  vi.resetModules();
  return (await import("./depot-postgres")).depotPostgres;
}

/** Requêtes envoyées, sans la création de table du premier appel. */
const requetesMetier = () => requetes.filter((r) => !r.sql.startsWith("create table"));

beforeEach(() => {
  requetes.length = 0;
  reponses.length = 0;
  neon.mockClear();
  vi.stubEnv("DATABASE_URL", "postgresql://test@localhost/test");
});

describe("depotPostgres", () => {
  it("sans DATABASE_URL : erreur claire", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const depot = await charger();
    await expect(depot.lister()).rejects.toThrow("DATABASE_URL manquant");
  });

  it("crée la table une seule fois, puis réutilise la connexion", async () => {
    const depot = await charger();
    await depot.lister();
    await depot.lister();
    expect(neon).toHaveBeenCalledTimes(1);
    expect(requetes.filter((r) => r.sql.startsWith("create table"))).toHaveLength(1);
  });

  it("lister un mois : filtre par préfixe de date passé en paramètre (pas de concaténation SQL)", async () => {
    const depot = await charger();
    reponses.push([], [{ data: ficheExemple() }]); // création de table, puis select
    expect(await depot.lister("2026-08")).toEqual([ficheExemple()]);
    expect(requetesMetier()[0].valeurs).toEqual(["2026-08%"]);
  });

  it("sauvegarder avec photo : la photo est stockée en base64", async () => {
    const depot = await charger();
    await depot.sauvegarder(ficheExemple(), Buffer.from("photo"));
    const [insertion] = requetesMetier();
    expect(insertion.sql).toContain("on conflict (date) do update");
    expect(insertion.valeurs).toEqual(["2026-08-29", JSON.stringify(ficheExemple()), Buffer.from("photo").toString("base64")]);
  });

  it("sauvegarder sans photo : garde la photo déjà archivée", async () => {
    const depot = await charger();
    await depot.sauvegarder(ficheExemple());
    const [insertion] = requetesMetier();
    expect(insertion.sql).not.toContain("photo = excluded.photo");
    expect(insertion.valeurs).toHaveLength(2);
  });

  it("photo : décode le base64, null s'il n'y en a pas", async () => {
    const depot = await charger();
    reponses.push([], [{ photo: Buffer.from("jpeg").toString("base64") }], []);
    expect(await depot.photo("2026-08-29")).toEqual(Buffer.from("jpeg"));
    expect(await depot.photo("2026-08-30")).toBeNull();
  });

  it("création de table en échec : on réessaie à la requête suivante", async () => {
    const depot = await charger();
    reponses.push(new Error("réseau"));
    await expect(depot.lister()).rejects.toThrow("réseau");
    await depot.lister();
    expect(requetes.filter((r) => r.sql.startsWith("create table"))).toHaveLength(2);
  });
});

describe("depot (choix du stockage)", () => {
  it("avec DATABASE_URL : PostgreSQL ; sans : fichiers JSON", async () => {
    vi.resetModules();
    expect((await import("./depot")).depot).toBe((await import("./depot-postgres")).depotPostgres);

    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    expect((await import("./depot")).depot).toBe((await import("./depot-json")).depotJson);
  });
});
