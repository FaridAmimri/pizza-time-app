import { expect, test } from "@playwright/test";
import { ficheVide } from "../src/domain/fiche-vide";

/** Image PNG de 1 × 1 pixel : suffit pour passer par la compression de l'appli, sans vraie photo. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Ce que Claude « lirait » sur la photo : la réponse est simulée, aucun appel réel à l'API. */
function lectureSimulee() {
  const fiche = ficheVide("2026-07-03");
  fiche.soir.especes = 120;
  fiche.employes = [{ nom: "Lina", acompte: null, matin: { da: "10:00", fs: "15:00" }, soir: { da: null, fs: null } }];
  return { ...fiche, doutes: ["soir.especes"] };
}

test("scan : la photo est lue, le doute est signalé, la fiche et sa photo sont archivées", async ({ page }) => {
  let corpsEnvoye: { image?: string; mediaType?: string } = {};
  await page.route("**/api/extract", async (route) => {
    corpsEnvoye = route.request().postDataJSON();
    await route.fulfill({ json: lectureSimulee() });
  });

  await page.goto("/scanner");
  await page.locator("#galerie").setInputFiles({ name: "fiche.png", mimeType: "image/png", buffer: PNG });

  // L'appli envoie l'image compressée en JPEG (base64), comme sur téléphone.
  await expect(page.getByRole("heading", { name: "Vérifier la fiche" })).toBeVisible();
  expect(corpsEnvoye.mediaType).toBe("image/jpeg");
  expect(corpsEnvoye.image?.length).toBeGreaterThan(0);

  await expect(page.getByText("1 valeur(s) en jaune sont à contrôler sur la photo.")).toBeVisible();
  const soir = page.locator("section", { has: page.getByRole("heading", { name: "Soir" }) });
  await expect(soir.getByText("À vérifier")).toBeVisible();

  // L'utilisateur corrige la valeur douteuse : le jaune disparaît.
  await soir.getByLabel("Espèces (€)").fill("125");
  await expect(soir.getByText("À vérifier")).toHaveCount(0);

  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("La fiche du 03/07/2026 est enregistrée.")).toBeVisible();

  // La photo est archivée avec la fiche.
  await page.getByRole("link", { name: "Photos archivées" }).click();
  await page.getByLabel("Mois").fill("2026-07");
  await expect(page.getByRole("button", { name: /3/ })).toBeVisible();
  const photo = await page.request.get("/api/photos/2026-07-03");
  expect(photo.headers()["content-type"]).toBe("image/jpeg");
});

// Note : Next.js ajoute son propre élément role="alert" (annonce de navigation), d'où le sélecteur ".alerte".
test("scan : si la lecture échoue, message clair et retour à la capture", async ({ page }) => {
  await page.route("**/api/extract", (route) =>
    route.fulfill({ status: 500, json: { erreur: "La fiche n'a pas pu être lue. Reprenez la photo." } }),
  );
  await page.goto("/scanner");
  await page.locator("#galerie").setInputFiles({ name: "fiche.png", mimeType: "image/png", buffer: PNG });

  await expect(page.locator(".alerte")).toHaveText("La fiche n'a pas pu être lue. Reprenez la photo.");
  await expect(page.getByRole("button", { name: "Saisir à la main" })).toBeVisible();
});
