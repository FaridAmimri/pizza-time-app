import { describe, expect, it } from "vitest";
import { getAt, setAt } from "./path";

describe("getAt", () => {
  const fiche = { soir: { especes: 200 }, employes: [{ nom: "Sami", soir: { fs: "00:30" } }] };

  it("lit une valeur par chemin, y compris dans un tableau", () => {
    expect(getAt(fiche, "soir.especes")).toBe(200);
    expect(getAt(fiche, "employes.0.soir.fs")).toBe("00:30");
  });

  it("chemin inexistant : undefined, sans erreur", () => {
    expect(getAt(fiche, "employes.5.soir.fs")).toBeUndefined();
    expect(getAt(null, "soir.especes")).toBeNull();
  });
});

describe("setAt", () => {
  it("écrit une valeur et renvoie une copie (l'original ne change pas)", () => {
    const fiche = { soir: { especes: 200 }, employes: [{ nom: "Sami" }, { nom: "Lina" }] };
    const copie = setAt(fiche, "employes.1.nom", "Léna");

    expect(copie.employes[1].nom).toBe("Léna");
    expect(fiche.employes[1].nom).toBe("Lina");
    expect(Array.isArray(copie.employes)).toBe(true);
    // Les branches non modifiées sont partagées, les autres sont copiées.
    expect(copie.soir).toBe(fiche.soir);
    expect(copie.employes).not.toBe(fiche.employes);
  });
});
