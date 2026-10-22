// Tableau de bord : compte les fiches de sortie/fiches/ et écrit sortie/tableau_de_bord.md.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const fiches = readdirSync('sortie/fiches').map((f) => JSON.parse(readFileSync(`sortie/fiches/${f}`, 'utf8')));

// Nombre de courriels par type (un courriel avec 2 demandes compte dans les 2 types).
const parType: Record<string, number> = {};
for (const fiche of fiches) {
    for (const type of fiche.types) parType[type] = (parType[type] ?? 0) + 1;
}

const prets = fiches.filter((f) => f.modele && f.modele !== 'question_avant_achat').length;
const aCompleter = fiches.filter((f) => f.modele === 'question_avant_achat').length;
const remontes = fiches.filter((f) => f.remonte).length;

const lignes = [
    '# Tableau de bord',
    '',
    `Courriels traités : ${fiches.length}`,
    '',
    '| Type de demande | Courriels |',
    '|---|---|',
    ...Object.entries(parType).map(([type, nombre]) => `| ${type} | ${nombre} |`),
    '',
    `- Brouillons prêts : ${prets}`,
    `- Brouillons à compléter par le conseiller : ${aCompleter}`,
    `- Courriels remontés au responsable : ${remontes}`,
];
writeFileSync('sortie/tableau_de_bord.md', lignes.join('\n') + '\n');
console.log(lignes.join('\n'));