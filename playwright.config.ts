import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (E2E) : un vrai navigateur sur l'application construite (`next build`).
 * Lancer `npm run build` avant (le script `npm run test:e2e` le fait).
 *
 * Deux serveurs, chacun avec son stockage JSON dans un dossier temporaire neuf :
 *  - 3100 sans code d'accès, pour les parcours métier ;
 *  - 3101 avec ACCES_MOT_DE_PASSE, pour tester la connexion.
 * Ni Claude ni Neon ne sont jamais appelés : pas de clé, pas de DATABASE_URL,
 * et la réponse de /api/extract est simulée dans le test du scan.
 */
const execution = Date.now();
const serveur = (port: number, env: Record<string, string> = {}) => ({
  command: `npx next start -p ${port}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: false,
  timeout: 60_000,
  env: { DOSSIER_DONNEES: path.join(tmpdir(), `fiches-e2e-${execution}-${port}`), ...env },
});

export const CODE_ACCES_E2E = "code-e2e";

export default defineConfig({
  testDir: "./e2e",
  // Le stockage JSON n'est pas prévu pour des écritures simultanées : un seul test à la fois.
  workers: 1,
  forbidOnly: !!process.env.CI, // un test.only oublié fait échouer la CI
  retries: process.env.CI ? 1 : 0,
  // Rapport HTML toujours généré (npx playwright show-report) ; annotations GitHub en plus dans la CI.
  reporter: [[process.env.CI ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure", // en cas d'échec : capture pas à pas, consultable dans le rapport
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [
    {
      name: "parcours",
      testIgnore: /connexion\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3100" },
    },
    {
      name: "connexion",
      testMatch: /connexion\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3101" },
    },
  ],
  webServer: [serveur(3100), serveur(3101, { ACCES_MOT_DE_PASSE: CODE_ACCES_E2E })],
});
