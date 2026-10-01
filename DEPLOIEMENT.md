# Mettre l'application en ligne (gratuit) : GitHub + Vercel + Neon

Résultat : une adresse fixe (`https://….vercel.app`) protégée par un code d'accès, que le client peut ouvrir à tout moment, même PC éteint.
Les fiches sont enregistrées dans une base Neon (gratuite), les photos aussi.

## 0. Avant tout : la clé API
1. Sur https://console.anthropic.com → **API Keys** : supprimer l'ancienne clé, en créer une nouvelle.
2. La coller **uniquement** dans `.env.local` (jamais dans `.env.example`, qui est publié sur GitHub).
3. Dans **Billing / Limits**, fixer un plafond de dépense mensuel.

## 1. Installer le nouveau paquet (une fois, sur le PC)
```powershell
cd "C:\Users\Farid\Desktop\Kaptiv Cloud\fiches-pizza-time"
npm install @neondatabase/serverless
```

## 2. Neon : la base de données
1. Compte sur https://neon.com → **Create project** (région Europe, par ex. Frankfurt).
2. Sur le tableau de bord, bouton **Connect** → copier la **connection string** (`postgresql://…?sslmode=require`).
3. Rien d'autre à faire : l'application crée sa table toute seule au premier enregistrement.

## 3. GitHub : envoyer le code
Le dépôt existe déjà (`FaridAmimri/pizza-time-app`). Après vérification que `.env.local` n'est pas suivi par git :
```powershell
git add .
git commit -m "Stockage Neon et code d'accès"
git push
```
Passer le dépôt en **privé** : GitHub → Settings → General → Danger Zone → Change visibility.

## 4. Vercel : l'hébergement
1. Compte sur https://vercel.com (se connecter avec GitHub) → **Add New… → Project** → importer `pizza-time-app`.
2. Avant de déployer, ouvrir **Environment Variables** et ajouter :

| Nom | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | la nouvelle clé |
| `DATABASE_URL` | la connection string Neon |
| `ACCES_MOT_DE_PASSE` | un code d'accès à donner au client |

3. **Deploy**. Au bout d'une minute environ, Vercel donne l'adresse du site.

## 5. Ensuite, au quotidien
- Une modification du code : `git add . ; git commit -m "…" ; git push` → Vercel redéploie seul (1 à 2 minutes).
- Une variable à changer : Vercel → Settings → Environment Variables, puis **Redeploy**.
- En local (`npm run dev`) : sans `DATABASE_URL` dans `.env.local`, les fiches restent dans le dossier `data/`, séparées de celles en ligne.

## Limites à connaître
- Vercel Hobby = usage non commercial : parfait pour la démo, à passer en Pro (ou autre) pour l'usage réel.
- Les photos sont stockées dans la base (≈ 0,3 à 0,5 Mo chacune) : le quota gratuit de Neon (0,5 Go) couvre quelques centaines de fiches. Au-delà : stockage de fichiers dédié.
- Un seul code d'accès partagé : suffisant pour la démo, pas pour 50 restaurants (comptes par utilisateur à prévoir).
- La lecture d'une fiche prend ~40 s ; la limite de durée est réglée à 120 s dans `src/app/api/extract/route.ts`.
