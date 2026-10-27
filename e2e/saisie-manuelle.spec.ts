import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

/**
 * Parcours principal : saisir une fiche à la main → l'enregistrer → la retrouver dans le journal
 * et dans la vue d'ensemble → exporter le bilan pour Excel.
 */
test("saisie manuelle : de la fiche au bilan du mois exporté", async ({ page }) => {
  await page.goto("/scanner");
  await page.getByRole("button", { name: "Saisir à la main" }).click();

  await expect(page.getByRole("heading", { name: "Vérifier la fiche" })).toBeVisible();
  await page.getByLabel("Date (AAAA-MM-JJ)").fill("2026-08-14");

  const soir = page.locator("section", { has: page.getByRole("heading", { name: "Soir" }) });
  await soir.getByLabel("Espèces (€)").fill("300");
  await soir.getByLabel("Carte bancaire (€)").fill("200");
  await page.getByLabel("Total en caisse écrit (€)").last().fill("500");

  await page.getByLabel("Nom").first().fill("Sami");
  await page.getByLabel("Matin : arrivée").first().fill("10:00");
  await page.getByLabel("Matin : sortie").first().fill("14:30");

  // Les totaux sont recalculés en direct pendant la saisie.
  await expect(page.getByText("Caisse de la journée : correspond à la fiche.")).toBeVisible();

  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("La fiche du 14/08/2026 est enregistrée.")).toBeVisible();

  // Journal du mois
  await page.getByRole("link", { name: "Voir le journal des feuilles" }).click();
  await page.getByLabel("Mois").fill("2026-08");
  const ligne = page.getByRole("row", { name: /ven\. 14/ });
  await expect(ligne).toContainText("500,00");
  await expect(ligne).toContainText("4 h 30");
  await expect(ligne).toContainText("Correspond");

  // Vue d'ensemble (le mois choisi est conservé d'un onglet à l'autre)
  await page.getByRole("link", { name: "Vue d'ensemble" }).click();
  await expect(page.locator(".kpi", { hasText: "Total en caisse" })).toContainText("500,00");

  // Export CSV
  const telechargement = page.waitForEvent("download");
  await page.getByRole("link", { name: "Télécharger pour Excel" }).click();
  const fichier = await telechargement;
  expect(fichier.suggestedFilename()).toBe("bilan-2026-08.csv");
  const csv = await readFile((await fichier.path())!, "utf-8");
  expect(csv).toContain('"Total en caisse";500');
  expect(csv).toContain('"Sami";1;4,5;0;4,5;0');
});

test("fiche sans date valide : refusée avec un message, rien n'est enregistré", async ({ page }) => {
  await page.goto("/scanner");
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Date (AAAA-MM-JJ)").fill("14/08/2026");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();

  await expect(page.locator(".alerte")).toHaveText("Fiche invalide : vérifiez la date.");
  await expect(page.getByRole("heading", { name: "Vérifier la fiche" })).toBeVisible();
});
