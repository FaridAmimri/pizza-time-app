/** Chargé avant chaque fichier de test : ajoute les assertions DOM (toBeInTheDocument, toHaveValue…). */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Démonte les composants rendus entre deux tests, pour qu'ils restent indépendants.
afterEach(() => cleanup());
