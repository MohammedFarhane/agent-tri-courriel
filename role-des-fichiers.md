# Rôle de chaque fichier du projet

## `src/` : le programme

| Fichier | Rôle |
|---|---|
| `agent.ts` | **le chef d'orchestre** : pour chaque courriel, il appelle les autres pièces dans l'ordre et écrit la fiche |
| `serveur-mcp.ts` | **le guichet** : expose les 4 outils (lire les courriels, chercher une commande, suivre un colis, écrire un brouillon) et vérifie chaque demande |
| `classifier.ts` | **l'IA** : demande à qwen le type de demande, vérifie sa réponse, ajoute le filet « remboursement » |
| `regles.ts` | **les règles de la boutique** : trouver le numéro, calculer les délais, fixer la priorité, décider s'il faut remonter au responsable |
| `modeles.ts` | **la rédaction** : lit les modèles de réponse et remplit les `{trous}` (prénom, numéro, statut, dates) |
| `courriels.ts` | **la lecture de la boîte mail** : se connecte en IMAP et renvoie les courriels triés du plus ancien au plus récent |
| `api-transporteur.ts` | **le faux transporteur** : petit serveur web qui répond au suivi d'un colis (`/suivi/ETX…`) |
| `tableau-de-bord.ts` | **le bilan** : compte les fiches et écrit le tableau de bord |
| `types.ts` | **le dictionnaire** : décrit la forme des données (commande, suivi, décision…) pour que TypeScript repère les erreurs |

## `scripts/` : les outils autour de la boîte de test

| Fichier | Rôle |
|---|---|
| `installer-greenmail.ts` | télécharge GreenMail (le serveur mail de test) et vérifie qu'il n'a pas été altéré |
| `demarrer-imap.ts` | démarre la boîte mail de test sur le PC |
| `remplir-boite.ts` | dépose les 25 courriels `.eml` dans la boîte |
| `verifier-boite.ts` | affiche le contenu de la boîte, pour vérifier |
| `connexion-imap.ts` | les identifiants de connexion à la boîte, partagés par les autres fichiers |

## `datas/` : les données fictives de la boutique

| Fichier | Rôle |
|---|---|
| `boite_test/courriel-01.eml` … `25.eml` | les 25 courriels de clients |
| `commandes.json` | les 50 commandes (client, statut, date de livraison, n° de suivi) |
| `suivi_transporteur.json` | l'état des 41 colis chez le transporteur |
| `modeles_reponse.md` | les modèles de réponse à trous |
| `politique_retour.md` | la politique de retour (d'où viennent les règles) |
| `README.md` | la description des données |

## À la racine : la configuration et la documentation

| Fichier | Rôle |
|---|---|
| `package.json` | le nom du projet, ses bibliothèques, ses commandes `npm run …` et la version de Node exigée |
| `package-lock.json` | les versions **exactes** de toutes les bibliothèques, pour que chacun installe les mêmes |
| `tsconfig.json` | les réglages de la vérification des types (`npm run types`) |
| `.env` | les vrais réglages de connexion (mot de passe), **jamais publié** |
| `.env.example` | le modèle de `.env`, publié pour les autres |
| `.gitignore` | la liste de ce que git ne doit pas enregistrer |
| `README.md` | la présentation du projet et son installation |
| `lancement-programme.md` | la procédure de lancement pas à pas |
| `role-des-fichiers.md` | ce fichier : le rôle de chaque fichier |
| `SPEC.md` | le cahier des charges : règles métier et décisions (en local seulement, pas sur GitHub) |

## Créés à l'exécution (pas sur GitHub)

| Dossier | Rôle |
|---|---|
| `sortie/fiches/` | une fiche par courriel traité |
| `sortie/brouillons/` | les brouillons de réponse à relire |
| `sortie/tableau_de_bord.md` | le bilan |
| `outils/greenmail/` | le serveur mail de test téléchargé |
| `node_modules/` | les bibliothèques installées par `npm install` |
