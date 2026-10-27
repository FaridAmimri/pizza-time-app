import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_ACCES, jetonAcces } from "@/lib/acces";
import { POST } from "./route";

/** cookies() de Next ne fonctionne que dans une vraie requête : on le remplace par un faux qui garde les appels. */
const { setCookie } = vi.hoisted(() => ({ setCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie }) }));

const connexion = (corps: unknown) =>
  POST(new Request("http://localhost/api/connexion", { method: "POST", body: JSON.stringify(corps) }));

beforeEach(() => {
  setCookie.mockReset();
  vi.stubEnv("ACCES_MOT_DE_PASSE", "code-secret");
  vi.useFakeTimers(); // la route attend 800 ms après un mauvais code : on avance le temps au lieu d'attendre
});

afterEach(() => vi.useRealTimers());

describe("POST /api/connexion", () => {
  it("bon code : pose un cookie httpOnly qui contient l'empreinte, jamais le code", async () => {
    const reponse = await connexion({ motDePasse: "code-secret" });
    expect(reponse.status).toBe(200);

    const [nom, valeur, options] = setCookie.mock.calls[0];
    expect(nom).toBe(COOKIE_ACCES);
    expect(valeur).toBe(await jetonAcces("code-secret"));
    expect(valeur).not.toContain("code-secret");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("mauvais code : 401 après un délai, sans cookie", async () => {
    const enCours = connexion({ motDePasse: "mauvais" });
    await vi.advanceTimersByTimeAsync(800);
    const reponse = await enCours;

    expect(reponse.status).toBe(401);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("corps illisible ou code absent : 401", async () => {
    const enCours = POST(new Request("http://localhost/api/connexion", { method: "POST", body: "pas du json" }));
    await vi.advanceTimersByTimeAsync(800);
    expect((await enCours).status).toBe(401);
  });

  it("sans ACCES_MOT_DE_PASSE (local) : accepté sans cookie", async () => {
    vi.stubEnv("ACCES_MOT_DE_PASSE", "");
    expect((await connexion({})).status).toBe(200);
    expect(setCookie).not.toHaveBeenCalled();
  });
});
