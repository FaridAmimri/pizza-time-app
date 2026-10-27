// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ficheExemple } from "../../tests/fixtures";
import { Controle } from "./Controle";

describe("Controle (totaux recalculés)", () => {
  it("fiche cohérente : total affiché et caisses conformes", () => {
    render(<Controle fiche={ficheExemple()} />);
    const ligneTotal = screen.getByText("Total en caisse").closest("tr")!;
    expect(ligneTotal.textContent?.replace(/\s/g, " ")).toContain("625,00 €");
    expect(screen.getByText("Caisse du matin : correspond à la fiche.")).toBeInTheDocument();
    expect(screen.getByText("Caisse de la journée : correspond à la fiche.")).toBeInTheDocument();
  });

  it("écart avec le total écrit : message d'alerte avec le montant", () => {
    const f = ficheExemple();
    f.totauxEcrits.totalEnCaisse = 600;
    render(<Controle fiche={f} />);
    expect(screen.getByText(/Caisse de la journée : écart de 25,00/)).toHaveClass("ecart-ko");
  });

  it("rien d'écrit sur la fiche : pas de verdict", () => {
    const f = ficheExemple();
    f.matin.totalEnCaisse = null;
    f.totauxEcrits.totalEnCaisse = null;
    render(<Controle fiche={f} />);
    expect(screen.queryByText(/Caisse/)).not.toBeInTheDocument();
  });
});
