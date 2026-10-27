import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractionExemple } from "../../tests/fixtures";
import { extraireFiche } from "./extraction";

/**
 * Le SDK Anthropic est remplacé par un faux : aucun appel réseau, aucune clé nécessaire.
 * On contrôle la réponse de Claude et on vérifie ce que le code en fait.
 * vi.hoisted : le faux doit exister avant que vi.mock (remonté en haut du fichier) ne s'exécute.
 */
const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

const reponseOutil = (input: unknown) => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: "toolu_test", name: "enregistrer_fiche", input }],
});

beforeEach(() => {
  create.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {}); // garde la sortie des tests lisible
});

describe("extraireFiche", () => {
  it("envoie l'image et un outil dont le schéma est celui de la fiche", async () => {
    create.mockResolvedValue(reponseOutil(extractionExemple()));
    await extraireFiche("QUJD", "image/png");

    const requete = create.mock.calls[0][0];
    expect(requete.messages[0].content[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "QUJD" },
    });
    expect(requete.tools[0].name).toBe("enregistrer_fiche");
    expect(requete.tools[0].input_schema.properties).toHaveProperty("doutes");
    expect(requete.tools[0].input_schema).not.toHaveProperty("$schema");
  });

  it("réponse par appel d'outil : renvoie la fiche et les doutes", async () => {
    create.mockResolvedValue(reponseOutil(extractionExemple()));
    const resultat = await extraireFiche("QUJD", "image/jpeg");
    expect(resultat).toEqual(extractionExemple());
  });

  it("heures normalisées : « 9:30 » devient « 09:30 », une heure illisible devient null", async () => {
    const lue = extractionExemple();
    lue.employes[0].matin = { da: "9:30", fs: "14h" };
    create.mockResolvedValue(reponseOutil(lue));

    const resultat = await extraireFiche("QUJD", "image/jpeg");
    expect(resultat.employes[0].matin).toEqual({ da: "09:30", fs: null });
  });

  it("plan B : Claude répond en texte avec du JSON, on le récupère", async () => {
    create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: `Voici la fiche : ${JSON.stringify(extractionExemple())} Bonne journée.` }],
    });
    expect(await extraireFiche("QUJD", "image/jpeg")).toEqual(extractionExemple());
  });

  it("ni outil ni JSON : erreur explicite", async () => {
    create.mockResolvedValue({ stop_reason: "max_tokens", content: [{ type: "text", text: "Je ne peux pas lire." }] });
    await expect(extraireFiche("QUJD", "image/jpeg")).rejects.toThrow("stop_reason: max_tokens");
  });

  it("données hors schéma : refusées par Zod (jamais enregistrées telles quelles)", async () => {
    create.mockResolvedValue(reponseOutil({ ...extractionExemple(), achats: "quinze" }));
    await expect(extraireFiche("QUJD", "image/jpeg")).rejects.toThrow();
  });
});
