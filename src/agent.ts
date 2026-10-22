// L'agent : pour chaque courriel, du plus ancien au plus récent → une fiche, et un brouillon si prévu.
// Les outils (boîte mail, commandes, transporteur, brouillons) passent par le serveur MCP.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { classifier } from './classifier.ts';
import { deciderCourriel, extraireNumeros } from './regles.ts';
import { chargerModeles, remplir, valeursPour } from './modeles.ts';
import type { Courriel } from './courriels.ts';
import type { Commande, Suivi } from './types.ts';

// Démarre le serveur MCP et s'y connecte.
const mcp = new Client({ name: 'agent', version: '1.0.0' });
await mcp.connect(new StdioClientTransport({ command: 'node', args: ['--env-file=.env', 'src/serveur-mcp.ts'] }));

// Appelle un outil MCP et renvoie ses données (le JSON contenu dans le texte de la réponse).
async function outil(nom: string, args = {}) {
    const reponse = await mcp.callTool({ name: nom, arguments: args }) as { content: { text: string }[]; isError?: boolean };
    if (reponse.isError) throw new Error(reponse.content[0].text);
    return JSON.parse(reponse.content[0].text);
}

const modeles = chargerModeles();
mkdirSync('sortie/fiches', { recursive: true });

const courriels: Courriel[] = await outil('lire_courriels');
for (const c of courriels) {
    if (existsSync(`sortie/fiches/${c.id}.json`)) continue;   // déjà traité
    const date = new Date(c.date);                             // le JSON a transformé la date en texte

    // 1. L'IA : quel type de demande ?
    const { types, suspect } = await classifier(c.objet, c.texte);

    // 2. Le code : numéro, commande, suivi (via les outils MCP).
    const numeros = extraireNumeros(`${c.objet} ${c.texte}`);
    const commande: Commande | null = numeros.length === 1 ? await outil('chercher_commande', { numero: numeros[0] }) : null;
    const suivi: Suivi | null = commande?.numero_suivi ? await outil('suivi_colis', { numero_suivi: commande.numero_suivi }) : null;

    // 3. Les règles : la décision.
    let decision = deciderCourriel(types, { numeros, commande, suivi, dateCourriel: date, expediteur: c.expediteur, suspect });

    // 4. Le brouillon, si la décision en prévoit un (destinataire = l'expéditeur, fixé par le code).
    if (decision.modele) {
        try {
            const texte = remplir(modeles.get(decision.modele)!, valeursPour(commande?.client.nom ?? c.nom, numeros[0] ?? null, suivi));
            await outil('ecrire_brouillon', { id: c.id, destinataire: c.expediteur, objet: c.objet, texte });
        } catch (erreur) {
            decision = { ...decision, modele: null, remonte: true, raison: `à vérifier : ${(erreur as Error).message}` };
        }
    }

    // 5. La fiche (écrite en dernier : elle marque le courriel comme traité).
    const fiche = { id: c.id, date, expediteur: c.expediteur, objet: c.objet, types, numero: numeros[0] ?? null, ...decision };
    writeFileSync(`sortie/fiches/${c.id}.json`, JSON.stringify(fiche, null, 2));
    console.log(c.id, types.join('+'), decision.priorite, decision.remonte ? 'remonté' : '');
}

await mcp.close();
