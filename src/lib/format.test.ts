import { describe, expect, it } from "vitest";
import { dateFr, formatHCourt, formatHeures } from "./format";

describe("format", () => {
  it("formatHeures : heures pleines et minutes sur deux chiffres", () => {
    expect(formatHeures(0)).toBe("0 h");
    expect(formatHeures(120)).toBe("2 h");
    expect(formatHeures(450)).toBe("7 h 30");
    expect(formatHeures(65)).toBe("1 h 05");
  });

  it("formatHCourt : version compacte", () => {
    expect(formatHCourt(120)).toBe("2h");
    expect(formatHCourt(450)).toBe("7h30");
    expect(formatHCourt(65)).toBe("1h05");
  });

  it("dateFr : AAAA-MM-JJ vers JJ/MM/AAAA", () => {
    expect(dateFr("2026-08-29")).toBe("29/08/2026");
  });
});
