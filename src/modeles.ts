import { readFileSync } from 'node:fs';
import type { Suivi } from './types.ts';

// Lit le fichier des modèles : chaque section « ## nom » devient une entrée nom → texte.
export function chargerModeles(chemin = 'datas/modeles_reponse.md'): Map<string, string> {
    const modeles = new Map<string, string>();
    const sections = readFileSync(chemin, 'utf8').split(/^## /m).slice(1);   // slice(1) : on saute l'introduction
    for (const section of sections) {
        const [nom, ...lignes] = section.split('\n');
        modeles.set(nom.trim(), lignes.join('\n').trim());
    }
    return modeles;
}

// Remplace chaque {champ} du modèle par sa valeur. Un champ sans valeur = erreur (jamais de trou dans un brouillon).
export function remplir(modele: string, valeurs: Record<string, string>): string {
    return modele.replace(/\{(\w+)\}/g, (_trou, champ: string) => {
        const valeur = valeurs[champ];
        if (valeur === undefined) throw new Error(`valeur manquante pour {${champ}}`);
        return valeur;
    });
}

// Les valeurs pour remplir un modèle. On n'ajoute que ce qu'on connaît :
// s'il manque un champ demandé par le modèle, remplir() refusera.
export function valeursPour(nomClient: string, numero: string | null, suivi: Suivi | null): Record<string, string> {
    const valeurs: Record<string, string> = {};

    // Prénom = 1er mot du nom, seulement s'il ne contient que des lettres (sinon : pas de prénom → remplir() refuse).
    const prenom = nomClient.trim().split(/\s+/)[0];
    if (/^[\p{L}'-]{1,30}$/u.test(prenom)) valeurs.prenom = prenom;

    if (numero) valeurs.numero = numero;

    if (suivi) {
        valeurs.statut_exact = suivi.statut;
        valeurs.derniere_etape = suivi.derniere_etape.evenement;
        valeurs.lieu = suivi.derniere_etape.lieu;
        // "2026-10-07T16:05:00" → "07/10/2026"
        valeurs.date_etape = suivi.derniere_etape.date.slice(0, 10).split('-').reverse().join('/');
        valeurs.date_estimee = suivi.date_estimee_livraison.split('-').reverse().join('/');
    }
    return valeurs;
}

