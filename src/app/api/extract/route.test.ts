import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractionExemple } from "../../../../tests/fixtures";
import { POST } from "./route";

/** Route + service d'extraction réels ; seul le SDK Anthropic est simulé (aucun appel à Claude, aucune vraie clé). */
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({ default: class { messages = { create }; } }));

const lire = (corps: unknown) =>
  POST(new Request("http://localhost/api/extract", { method: "POST", body: JSON.stringify(corps) }));

beforeEach(() => {
  create.mockReset();
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-cle-de-test");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/extract", () => {
  it("photo lue : renvoie la fiche extraite", async () => {
    create.mockResolvedValue({
      stop_reason: "tool_use",
      content: [{ type: "tool_use", id: "t", name: "enregistrer_fiche", input: extractionExemple() }],
    });
    const reponse = await lire({ image: "QUJD" });

    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual(extractionExemple());
    // Sans mediaType, la route suppose une photo JPEG.
    expect(create.mock.calls[0][0].messages[0].content[0].source.media_type).toBe("image/jpeg");
  });

  it("sans clé API : 500 avec un message clair, et Claude n'est pas appelé", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const reponse = await lire({ image: "QUJD" });
    expect(reponse.status).toBe(500);
    expect((await reponse.json()).erreur).toMatch(/ANTHROPIC_API_KEY/);
    expect(create).not.toHaveBeenCalled();
  });

  it("erreur de Claude : 500 avec un message pour l'utilisateur (pas le détail technique)", async () => {
    create.mockRejectedValue(new Error("overloaded_error"));
    const reponse = await lire({ image: "QUJD" });
    expect(reponse.status).toBe(500);
    const { erreur } = await reponse.json();
    expect(erreur).toMatch(/Reprenez la photo/);
    expect(erreur).not.toMatch(/overloaded/);
  });
});
