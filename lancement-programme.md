# Lancement du programme (de zéro)

Tout se lance **depuis le dossier du projet** (`agent-tir-courriel`).

## 0. Avant de commencer (une seule fois)

```
npm install
npm run imap:installer
```

Le fichier `.env` doit aussi exister.

## 1. Vérifier qu'Ollama tourne

```
ollama list
```

- ✅ `qwen2.5:3b` apparaît dans la liste.
- ❌ Si tu obtiens une erreur de connexion, lance l'application Ollama, puis réessaie.

## 2. Terminal 1 : démarrer la boîte IMAP

```
npm run imap:demarrer
```

- ✅ La dernière ligne est `Starting GreenMail API server at http://127.0.0.1:8090/`.
- ❌ Si tu vois `Address already in use`, c'est qu'une ancienne boîte tourne encore : ferme l'ancien terminal, puis relance.

**Laisse ce terminal ouvert.**

## 3. Terminal 2 : remplir la boîte

```
npm run imap:remplir
```

- ✅ Le message final est `25 courriel(s) déposé(s) dans INBOX.`

Vérification facultative :

```
npm run imap:verifier
```

- ✅ Il affiche `25 message(s) dans INBOX.`

## 4. Terminal 2 : démarrer l'API transporteur

```
node src/api-transporteur.ts
```

- ✅ Tu vois `41 colis chargés` puis `API transporteur sur http://127.0.0.1:3000`.
- ❌ `Address already in use` : l'API tourne déjà dans un autre terminal.

**Laisse ce terminal ouvert.**

## 5. Terminal 3 : vider les anciens résultats

Si le dossier `sortie/` existe déjà, supprime-le. Sinon, l'agent saute les courriels déjà traités et n'affiche rien.

```
Remove-Item -Recurse -Force sortie
```

(Ou supprime-le dans l'explorateur de fichiers.)

## 6. Terminal 3 : lancer l'agent

```
node --env-file=.env src/agent.ts
```

- ✅ En environ 2 minutes, **25 lignes** s'affichent, par exemple `courriel-uid-16 remboursement_geste normale remonté`.
- ❌ Rien ne s'affiche : la boîte est vide (retour à l'étape 3) ou `sortie/` n'a pas été supprimé (étape 5).

## 7. Terminal 3 : le tableau de bord

```
node src/tableau-de-bord.ts
```

- ✅ `Courriels traités : 25`, 19 brouillons prêts, 4 à compléter, 10 remontés.

## 8. Lire les résultats

- `sortie/brouillons/` : les brouillons à relire ;
- `sortie/fiches/` : une fiche par courriel ;
- `sortie/tableau_de_bord.md` : le résumé.

## 9. Tout arrêter

Fais **Ctrl+C** dans le terminal 2 (l'API), puis dans le terminal 1 (la boîte IMAP).

## En résumé

| Terminal | Commandes | Reste ouvert ? |
|---|---|---|
| 1 | `npm run imap:demarrer` | oui |
| 2 | `npm run imap:remplir`, puis `node src/api-transporteur.ts` | oui |
| 3 | supprimer `sortie/`, `node --env-file=.env src/agent.ts`, `node src/tableau-de-bord.ts` | non |
