import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Tests unitaires et d'intégration (Vitest).
 * - Environnement "node" par défaut ; les tests de composants passent en jsdom
 *   avec le commentaire `// @vitest-environment jsdom` en tête de fichier.
 * - Les tests E2E (Playwright, dossier e2e/) sont exclus : ils tournent à part.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/app/**/page.tsx", "src/app/layout.tsx"],
      reporter: ["text", "html", "lcov"],
    },
  },
});
