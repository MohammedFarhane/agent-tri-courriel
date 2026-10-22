// Serveur MCP : expose les 4 outils de l'agent (SPEC.md, section 6). Chaque outil vérifie lui-même ses paramètres.
// Attention : ce serveur parle par stdin/stdout → jamais de console.log ici (ça casserait le protocole).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { lireCourriels } from './courriels.ts';
import type { Commande } from './types.ts';

const commandes: Commande[] = JSON.parse(readFileSync('datas/commandes.json', 'utf8'));
mkdirSync('sortie/brouillons', { recursive: true });

// Un outil MCP renvoie du texte : on y met nos données en JSON.
function resultat(donnees: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(donnees) }] };
}

const serveur = new McpServer({ name: 'agent-tir-courriel', version: '1.0.0' });

serveur.registerTool('lire_courriels', {
    description: 'Lit la boîte de réception (lecture seule), du plus ancien au plus récent.',
}, async () => resultat(await lireCourriels()));

serveur.registerTool('chercher_commande', {
    description: 'Renvoie la commande correspondant au numéro, ou null.',
    inputSchema: { numero: z.string().regex(/^ML-\d{4}-\d{4}$/) },
}, async ({ numero }) => resultat(commandes.find((c) => c.numero === numero) ?? null));

serveur.registerTool('suivi_colis', {
    description: "Interroge l'API locale du transporteur. Renvoie le suivi, ou null.",
    inputSchema: { numero_suivi: z.string().regex(/^ETX\d{6}BE$/) },
}, async ({ numero_suivi }) => {
    const reponse = await fetch(`http://127.0.0.1:3000/suivi/${numero_suivi}`);
    return resultat(reponse.ok ? await reponse.json() : null);
});

serveur.registerTool('ecrire_brouillon', {
    description: 'Écrit un brouillon dans sortie/brouillons/ (jamais d\'envoi, jamais d\'écrasement).',
    inputSchema: {
        id: z.string().regex(/^courriel-uid-\d+$/),   // empêche d'écrire ailleurs que dans sortie/brouillons/
        destinataire: z.email(),
        objet: z.string(),
        texte: z.string(),
    },
}, async ({ id, destinataire, objet, texte }) => {
    // flag 'wx' : erreur si le fichier existe déjà → jamais d'écrasement
    writeFileSync(`sortie/brouillons/${id}.txt`, `À : ${destinataire}\nObjet : Re: ${objet}\n\n${texte}\n`, { flag: 'wx' });
    return resultat('ok');
});

await serveur.connect(new StdioServerTransport());
