# Articulix — Guide de déploiement

## Ce que vous allez obtenir
Une appli web accessible depuis n'importe quel appareil pour gérer :
- **Stock** des 70+ modèles (normal + doré)
- **Points de vente** (Intermarché, boulangerie...)
- **Réassorts** planifiés et historique
- **Générateur de sachets** intelligent

---

## Étape 1 — Créer la base de données (Supabase)

1. Allez sur **https://supabase.com** → "Start for free"
2. Créez un compte et un nouveau projet (choisissez "Europe West" comme région)
3. Notez le **mot de passe** de votre projet
4. Dans le menu gauche → **SQL Editor**
5. Copiez-collez tout le contenu du fichier `supabase-schema.sql` et cliquez **Run**
6. Dans le menu gauche → **Settings → API**
7. Copiez :
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public key** (longue clé commençant par eyJ...)

---

## Étape 2 — Mettre l'appli en ligne (Vercel)

1. Allez sur **https://github.com** → créez un compte gratuit
2. Créez un nouveau repository nommé `articulix`
3. Uploadez tous les fichiers de ce dossier dans le repository
4. Allez sur **https://vercel.com** → "Sign up" avec GitHub
5. Cliquez **"Add New Project"** → sélectionnez votre repo `articulix`
6. Dans **"Environment Variables"**, ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre anon key
7. Cliquez **Deploy** — ça prend 2-3 minutes

Votre appli sera accessible à une URL du type : `articulix.vercel.app`

---

## Étape 3 — Utiliser l'appli

### Premier lancement
1. Allez dans **Stock** → ajoutez vos 70 modèles avec leurs stocks
2. Allez dans **Points de vente** → ajoutez vos Intermarché / boulangeries
3. C'est prêt !

### Au quotidien
- **Stock bas ?** → L'alerte rouge/orange vous dit quoi imprimer
- **Réassort prévu ?** → Créez un réassort dans "Réassorts", suivez son statut
- **Préparer des sachets ?** → "Sachets" → générez, puis "Déduire du stock"

---

## Besoin d'aide ?
Si vous bloquez à une étape, prenez une capture d'écran de l'erreur et partagez-la.
