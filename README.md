# Agent de tri des courriels de commandes

Agent local qui lit les courriels du service client (boutique fictive Maison Lenoir), du plus ancien au plus récent,
et produit pour chacun une fiche et un brouillon de réponse. **Il n'envoie jamais rien.**
Les remboursements et gestes commerciaux sont toujours remontés au responsable.

## Prérequis

- Node.js 24, Java 21, Ollama avec le modèle `qwen2.5:3b` (`ollama pull qwen2.5:3b`)
- GreenMail (boîte IMAP de test) : `outils/greenmail/greenmail-standalone-2.1.14.jar`
  (téléchargeable sur Maven Central : `com.icegreen:greenmail-standalone:2.1.14`)

## Installation

```
npm install
copy .env.example .env      (puis choisir un mot de passe dans .env)
```

## Lancement

Terminal 1, la boîte IMAP de test (vide à chaque démarrage) :
```
npm run imap:demarrer
```

Terminal 2, remplir la boîte, puis démarrer l'API transporteur :
```
npm run imap:remplir
node src/api-transporteur.ts
```

Terminal 3, l'agent puis le tableau de bord :
```
node --env-file=.env src/agent.ts
node src/tableau-de-bord.ts
```

## Résultats

- `sortie/fiches/` : une fiche JSON par courriel (type, n° de commande, priorité, remonté ou non, raison)
- `sortie/brouillons/` : les brouillons à relire avant envoi
- `sortie/tableau_de_bord.md` : courriels par type, brouillons prêts, à compléter, remontés

Un courriel déjà traité n'est jamais retraité. Pour tout recommencer : supprimer le dossier `sortie/`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `src/agent.ts` | la boucle : lit, classe, décide, rédige |
| `src/serveur-mcp.ts` | les 4 outils (courriels, commandes, suivi, brouillons) exposés en MCP |
| `src/classifier.ts` | le seul usage de l'IA : le type de demande |
| `src/regles.ts` | les règles métier (priorité, délais, remontée) |
| `src/modeles.ts` | le remplissage des modèles de réponse |
| `src/api-transporteur.ts` | l'API locale qui simule le transporteur |
| `src/tableau-de-bord.ts` | le tableau de bord |

## Limites connues

- Le petit modèle qwen2.5:3b peut se tromper de type (la décision reste prudente : un humain relit tout).
- Pas de délai maximal sur l'appel à Ollama.
- Pas de tests automatiques.
