/** Fait pointer le stockage JSON vers un dossier temporaire neuf pour chaque test (les vraies données ne sont jamais touchées). */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, vi } from "vitest";

export function utiliserDepotTemporaire() {
  let dossier = "";
  beforeEach(async () => {
    dossier = await mkdtemp(path.join(tmpdir(), "fiches-test-"));
    vi.stubEnv("DOSSIER_DONNEES", dossier);
    vi.stubEnv("DATABASE_URL", ""); // force le stockage JSON, même si la variable existe sur la machine
  });
  afterEach(async () => {
    await rm(dossier, { recursive: true, force: true });
  });
  return { dossier: () => dossier };
}
