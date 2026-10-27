import { describe, expect, it } from "vitest";
import { combiner } from "./use-fiches";

describe("combiner (état de plusieurs chargements)", () => {
  it("une erreur l'emporte sur tout", () => {
    expect(combiner("pret", "chargement", "erreur")).toBe("erreur");
  });

  it("puis l'attente, puis le chargement", () => {
    expect(combiner("pret", "attente", "chargement")).toBe("attente");
    expect(combiner("pret", "chargement")).toBe("chargement");
  });

  it("prêt seulement quand tout est prêt", () => {
    expect(combiner("pret", "pret")).toBe("pret");
  });
});
