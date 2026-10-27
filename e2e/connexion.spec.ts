import { expect, test } from "@playwright/test";
import { CODE_ACCES_E2E } from "../playwright.config";

/** Serveur lancé avec ACCES_MOT_DE_PASSE (projet « connexion » de playwright.config.ts). */
test("sans cookie : les pages redirigent vers la connexion et l'API répond 401", async ({ page, request }) => {
  await page.goto("/journal");
  await expect(page).toHaveURL(/\/connexion\?suite=%2Fjournal$/);

  const api = await request.get("/api/fiches");
  expect(api.status()).toBe(401);
});

test("mauvais code refusé, bon code : retour à la page demandée", async ({ page }) => {
  await page.goto("/journal");

  await page.getByLabel("Code d'accès").fill("mauvais-code");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.locator(".alerte")).toHaveText("Code d'accès incorrect.");

  await page.getByLabel("Code d'accès").fill(CODE_ACCES_E2E);
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByRole("heading", { name: "Journal des feuilles" })).toBeVisible();

  // Le cookie ouvre aussi l'API.
  expect((await page.request.get("/api/fiches")).status()).toBe(200);
});
