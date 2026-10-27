// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Fiche } from "@/domain/types";
import { ficheExemple } from "../../tests/fixtures";
import { FicheForm } from "./FicheForm";

/** Le formulaire est « contrôlé » : ce petit parent garde l'état, comme le fait la vraie page. */
function Formulaire({ depart, doutes = [], onVu = () => {} }: { depart: Fiche; doutes?: string[]; onVu?: (c: string) => void }) {
  const [fiche, setFiche] = useState(depart);
  return <FicheForm fiche={fiche} doutes={doutes} onChange={setFiche} onVu={onVu} />;
}

const sectionSoir = () => screen.getByRole("heading", { name: "Soir" }).closest("section")!;

describe("FicheForm", () => {
  it("affiche les valeurs de la fiche et signale les champs douteux", () => {
    render(<Formulaire depart={ficheExemple()} doutes={["soir.especes"]} />);
    const especesSoir = within(sectionSoir()).getByLabelText("Espèces (€)");
    expect(especesSoir).toHaveValue(200);
    expect(within(sectionSoir()).getByText("À vérifier")).toBeInTheDocument();
  });

  it("corriger un montant met à jour les totaux en direct et signale le champ comme vu", async () => {
    const onVu = vi.fn();
    render(<Formulaire depart={ficheExemple()} onVu={onVu} />);

    const especesSoir = within(sectionSoir()).getByLabelText("Espèces (€)");
    await userEvent.clear(especesSoir);
    await userEvent.type(especesSoir, "175");

    expect(onVu).toHaveBeenLastCalledWith("soir.especes");
    // 625 - 200 + 175 = 600 calculé, 625 écrit : écart de -25 €
    expect(screen.getByText(/Caisse de la journée : écart de -25,00/)).toBeInTheDocument();
  });

  it("heure de sortie oubliée : « Une heure est manquante »", async () => {
    render(<Formulaire depart={ficheExemple()} />);
    expect(screen.queryByText(/Une heure est manquante/)).not.toBeInTheDocument();
    await userEvent.clear(screen.getAllByLabelText("Matin : sortie")[0]);
    expect(screen.getByText(/Une heure est manquante/)).toBeInTheDocument();
  });

  it("ajouter puis retirer un employé", async () => {
    render(<Formulaire depart={ficheExemple()} />);
    expect(screen.getAllByLabelText("Nom")).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Ajouter un employé" }));
    expect(screen.getAllByLabelText("Nom")).toHaveLength(3);

    await userEvent.click(screen.getAllByRole("button", { name: "Retirer cet employé" })[0]);
    expect(screen.getAllByLabelText("Nom").map((c) => (c as HTMLInputElement).value)).toEqual(["Lina", ""]);
  });

  it("date figée : non modifiable (la photo archivée y est liée)", () => {
    render(<FicheForm fiche={ficheExemple()} doutes={[]} onChange={() => {}} onVu={() => {}} dateFigee />);
    expect(screen.getByLabelText("Date (AAAA-MM-JJ)")).toBeDisabled();
  });
});
