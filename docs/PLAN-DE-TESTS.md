# Plan de tests : Fiches journalières Pizza Time

## 1. Objectif

Garantir qu'une version ne part en production que si les règles de calcul, la lecture des fiches,
le stockage et l'accès protégé fonctionnent. Tout est automatisé et lancé à chaque pull request.

## 2. Ce qui est risqué (et donc testé en priorité)

| Risque | Conséquence | Où c'est testé |
|---|---|---|
| Erreur dans une formule (total en caisse, heures après minuit) | Bilan et paie faux | Unitaires `src/domain/calculs.test.ts` |
| Claude renvoie des données mal formées ou en texte | Fiche fausse enregistrée ou plantage | Unitaires `src/services/extraction.test.ts` |
| Fiche invalide acceptée par l'API | Données corrompues | Intégration `src/app/api/fiches/route.test.ts` |
| Site ouvert sans code d'accès | Clé API et données exposées | Intégration `src/middleware.test.ts`, E2E `e2e/connexion.spec.ts` |
| Export Excel illisible (accents, décimales) | Bilan inutilisable par le client | Unitaires `export-csv.test.ts`, E2E `saisie-manuelle.spec.ts` |
| Parcours cassé dans le navigateur | Utilisateur bloqué | E2E `e2e/*.spec.ts` |

## 3. Niveaux de tests (pyramide)

| Niveau | Outil | Quoi | Combien |
|---|---|---|---|
| Unitaires | Vitest | Fonctions pures (`domain`, `lib`), services avec dépendances simulées | Beaucoup, < 1 s |
| Intégration | Vitest | Routes API appelées avec un vrai `Request` + vrai dépôt JSON dans un dossier temporaire ; middleware | Quelques-uns par route |
| Composants | Vitest + Testing Library (jsdom) | Formulaire de fiche, champ, contrôle des totaux, comme un utilisateur | Composants à logique |
| Bout en bout | Playwright (Chromium) | Application construite, vrai navigateur, 3 parcours critiques | Peu, les plus importants |

## 4. Ce qui est simulé, et pourquoi

- **Claude (SDK Anthropic)** : simulé avec `vi.mock` en unitaire/intégration, et la réponse de `/api/extract` est interceptée avec `page.route` en E2E.
  Pourquoi : un vrai appel coûte de l'argent, prend environ 40 s, n'est pas déterministe et demande une clé secrète.
- **Neon (PostgreSQL)** : le client `neon` est simulé ; on vérifie les requêtes SQL envoyées et leurs paramètres.
- **Stockage JSON** : réel, mais dans un dossier temporaire (variable `DOSSIER_DONNEES`).
- Conséquence : **aucun secret n'est nécessaire en CI**.

Limite assumée : la qualité réelle de lecture de Claude n'est pas testée automatiquement (voir § 7).

## 5. Parcours de bout en bout

1. **Saisie manuelle** : saisir une fiche → totaux recalculés en direct → enregistrer → journal → vue d'ensemble → export CSV.
2. **Scan** : envoyer une photo → doute signalé en jaune → correction → enregistrement → photo archivée. Cas d'échec de lecture : message clair.
3. **Connexion** : sans cookie, redirection et API en 401 → mauvais code refusé → bon code, retour à la page demandée.

## 6. Critères de validation d'une version

Une pull request peut être fusionnée dans `main` (donc déployée par Vercel) seulement si :

- le typage passe (`npm run typecheck`) ;
- tous les tests Vitest passent (`npm run test:coverage`) ;
- le build passe et les tests Playwright passent ;
- ces deux jobs GitHub Actions sont **obligatoires** dans la règle de protection de `main`
  (« Typage et tests unitaires » et « Build et tests de bout en bout »).

La couverture est mesurée et publiée en artefact, sans seuil bloquant pour l'instant.

## 7. Hors du périmètre automatisé (contrôles manuels)

- Qualité de lecture de vraies photos par Claude : à vérifier sur quelques fiches réelles quand le prompt ou le modèle change.
- Affichage sur téléphone et appareil photo.
- Base Neon réelle : vérifiée sur le déploiement Preview de Vercel.

## 8. Commandes

```bash
npm test                 # tests unitaires, intégration et composants (Vitest)
npm run test:watch       # relance à chaque modification
npm run test:coverage    # + rapport de couverture dans coverage/
npm run test:e2e         # build + tests Playwright (npx playwright install chromium la première fois)
```
