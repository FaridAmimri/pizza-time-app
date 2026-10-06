# Fiches journalières Pizza Time : prototype

Photo d'une fiche → lecture par Claude → vérification à l'écran → enregistrement → bilan du mois (heures par employé, recettes) → export Excel.

**Démo en ligne :** [pizza-time-app-one.vercel.app](https://pizza-time-app-one.vercel.app) (accès protégé par un code, fourni sur demande).

## Démarrer

```bash
npm install
cp .env.example .env.local     # puis coller votre clé ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
npm test                       # tests des calculs
```

**Stockage :** sans `DATABASE_URL`, les fiches sont enregistrées dans un fichier JSON local. Avec `DATABASE_URL` (PostgreSQL, Neon en production), l'application utilise automatiquement la base.

Sur téléphone : ouvrir la [démo en ligne](https://pizza-time-app-one.vercel.app) ou, en local (même réseau Wi-Fi), `http://<ip-de-votre-pc>:3000`. La caméra s'ouvre avec le bouton « Prendre une photo ».

## Où modifier quoi

| Je veux…                                            | Fichier                          |
|-----------------------------------------------------|----------------------------------|
| Ajouter / retirer un champ de la fiche              | `src/domain/types.ts`, puis `src/components/FicheForm.tsx` |
| Changer une formule de calcul                       | `src/domain/calculs.ts` (+ test dans `calculs.test.ts`) |
| Adapter la lecture si la fiche papier change        | `src/services/prompt.ts`         |
| Changer de modèle IA                                | variable `ANTHROPIC_MODEL`       |
| Changer de base de données                          | Implémenter l'interface `DepotFiches` (voir `src/services/depot-postgres.ts`) ; le choix se fait dans `depot.ts` |
| Modifier le fichier Excel exporté                   | `src/services/export-csv.ts`     |
| Ajouter ou renommer un onglet                       | `src/components/Navigation.tsx` (1 ligne) + `src/app/<onglet>/page.tsx` |
| Changer ce que montre la vue d'ensemble             | `src/app/page.tsx` (calculs dans `src/domain/calculs.ts`) |
| Changer les alertes (écarts, heures manquantes)     | `alertes()` dans `src/domain/calculs.ts` |
| Changer les couleurs / le style                     | `src/app/globals.css` (variables en haut) |

## Les onglets

| Onglet | Chemin | Contenu |
|---|---|---|
| Vue d'ensemble | `/` | Chiffres du mois, alertes à vérifier, jours sans fiche, recettes, commandes internet, export Excel |
| Scanner une fiche | `/scanner` | Photo ou galerie, lecture par Claude, vérification, enregistrement |
| Journal des feuilles | `/journal` | Liste des fiches du mois ; `/journal/AAAA-MM-JJ` pour relire ou corriger une fiche |
| Heures de l'équipe | `/equipe` | Récapitulatif par employé et feuille de pointage jour par jour |
| Photos archivées | `/photos` | Photos des fiches du mois, agrandissement et téléchargement |

Le mois choisi est conservé quand on change d'onglet. L'ancienne page `/mois` redirige vers la vue d'ensemble.
Supprimer une fiche supprime aussi sa photo archivée. La date d'une fiche enregistrée n'est pas modifiable (sa photo y est liée).

## Principes

- **L'IA lit, le code calcule.** Claude recopie seulement ce qui est écrit ; tous les totaux sont calculés dans `calculs.ts`.
- **Une seule définition des données** (`types.ts`) : elle sert à l'IA, à la validation et à TypeScript.
- **Toujours une étape de vérification humaine.** Les champs douteux sont en jaune ; un écart avec le total écrit sur la fiche est signalé en rouge.
- **Stockage isolé** derrière une interface : JSON en local, PostgreSQL en production, interchangeables sans toucher au reste.

## Hypothèses à faire valider par le client

1. Formule du total en caisse, telle qu'imprimée en bas de la fiche : espèces + ticket restaurant + carte bancaire + Dishop en ligne + acomptes + achats (le chèque vacances n'y figure pas).
2. « Total en bon » : repris tel qu'écrit sur la fiche, non recalculé.
3. Les « commandes internet déjà réglées » sont informatives : elles ne s'ajoutent pas au total en caisse.
4. Une fiche par jour, un seul restaurant (clé = date).
5. Les heures qui passent minuit (18:00 → 00:30) sont gérées.

## Idées d'évolutions faciles

Plusieurs restaurants (ajouter `restaurantId` au schéma et à la clé du dépôt) · connexion par mot de passe · liste d'employés connus pour corriger les noms mal lus · scan de plusieurs fiches d'un coup · export PDF · tarif horaire et coût salarial.
