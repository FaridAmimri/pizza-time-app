// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Champ } from "./Champ";

/** On cherche les éléments comme un utilisateur (par leur libellé), pas par leur classe CSS. */
describe("Champ", () => {
  it("le libellé est relié au champ (accessibilité)", () => {
    render(<Champ label="Espèces (€)" type="montant" value={12.5} onChange={() => {}} />);
    expect(screen.getByLabelText("Espèces (€)")).toHaveValue(12.5);
  });

  it("montant saisi : transmis comme nombre", async () => {
    const onChange = vi.fn();
    render(<Champ label="Achats (€)" type="montant" value={null} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Achats (€)"), "7");
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("champ vidé : transmis comme null (case vide sur la fiche)", async () => {
    const onChange = vi.fn();
    render(<Champ label="Achats (€)" type="montant" value={7} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Achats (€)"));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("texte : transmis tel quel", async () => {
    const onChange = vi.fn();
    render(<Champ label="Nom" type="texte" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Nom"), "S");
    expect(onChange).toHaveBeenLastCalledWith("S");
  });

  it("doute de l'IA : affiche « À vérifier »", () => {
    const { rerender } = render(<Champ label="Nom" type="texte" value="Sami" onChange={() => {}} />);
    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    rerender(<Champ label="Nom" type="texte" value="Sami" onChange={() => {}} douteux />);
    expect(screen.getByText("À vérifier")).toBeInTheDocument();
  });

  it("désactivé : non modifiable", () => {
    render(<Champ label="Date" type="texte" value="2026-08-29" onChange={() => {}} disabled />);
    expect(screen.getByLabelText("Date")).toBeDisabled();
  });
});
