import { describe, expect, it } from "vitest";
import { egaux, jetonAcces } from "./acces";

describe("jetonAcces", () => {
  it("empreinte SHA-256 en hexadécimal, stable pour un même mot de passe", async () => {
    const jeton = await jetonAcces("secret");
    expect(jeton).toMatch(/^[0-9a-f]{64}$/);
    expect(await jetonAcces("secret")).toBe(jeton);
  });

  it("ne contient jamais le mot de passe en clair", async () => {
    expect(await jetonAcces("secret")).not.toContain("secret");
  });

  it("mots de passe différents : jetons différents", async () => {
    expect(await jetonAcces("secret")).not.toBe(await jetonAcces("Secret"));
  });
});

describe("egaux", () => {
  it("chaînes identiques : vrai", () => {
    expect(egaux("abc", "abc")).toBe(true);
    expect(egaux("", "")).toBe(true);
  });

  it("un caractère différent, préfixe ou longueur différente : faux", () => {
    expect(egaux("abc", "abd")).toBe(false);
    expect(egaux("abc", "ab")).toBe(false);
    expect(egaux("ab", "abc")).toBe(false);
    expect(egaux("abc", "")).toBe(false);
  });
});
