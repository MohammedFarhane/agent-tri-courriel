// Règles métier de l'agent (SPEC.md, section 4). Uniquement du code déterministe, pas d'IA.
import type { Commande, Decision, Priorite, Suivi, TypeDemande } from './types.ts';

// ---- Numéro de commande ----

// Trouve les numéros de commande (format ML-2026-1234) dans un texte, sans doublon.
export function extraireNumeros(texte: string): string[] {
    const trouves = texte.match(/\bML-\d{4}-\d{4}\b/g) ?? [];
    return [...new Set(trouves)];
}

// ---- Délais (SPEC 4.2) : comptés jusqu'à la date du courriel, bornes incluses ----

export const DELAI_RETOUR_JOURS = 30;
export const DELAI_DEFAUT_JOURS = 14;

// Nombre de jours entiers entre la livraison et le courriel.
export function joursDepuisLivraison(dateLivraison: string, dateCourriel: Date): number {
    const UN_JOUR_MS = 24 * 60 * 60 * 1000;
    const livraison = new Date(dateLivraison);
    return Math.floor((dateCourriel.getTime() - livraison.getTime()) / UN_JOUR_MS);
}

// ---- Priorité (SPEC 4.1) ----

export const PRIORITE: Record<TypeDemande, Priorite> = {
    non_recu: 'haute',
    defectueux_endommage: 'haute',
    erreur_preparation: 'haute',
    remboursement_geste: 'normale',
    suivi: 'normale',
    retour_echange: 'normale',
    question_avant_achat: 'basse',
    autre: 'normale',
};

// ---- Décision (SPEC 4.3 et 4.4) ----

// Tout ce que l'agent sait sur un courriel au moment de décider.
export type Contexte = {
    numeros: string[];          // numéros trouvés dans le courriel
    commande: Commande | null;  // commande trouvée (null si aucune)
    suivi: Suivi | null;        // réponse du transporteur (null si aucune)
    dateCourriel: Date;
    expediteur: string;         // adresse e-mail de l'expéditeur
    suspect: boolean;           // true si le courriel contient des instructions suspectes
};

// Les 3 sortes de décision possibles.
function brouillon(type: TypeDemande, modele: Decision['modele'], raison: string): Decision {
    return { priorite: PRIORITE[type], modele, remonte: false, raison };
}
function escalade(type: TypeDemande, raison: string): Decision {
    return { priorite: PRIORITE[type], modele: 'accuse_escalade', remonte: true, raison };
}
function aVerifier(type: TypeDemande, raison: string): Decision {
    return { priorite: PRIORITE[type], modele: null, remonte: true, raison: `à vérifier : ${raison}` };
}

const STATUTS_NORMAUX = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STATUTS_INCIDENT = ['EXCEPTION_ADDRESS', 'DELAYED'];

// Décide pour UN type de demande.
export function decider(type: TypeDemande, ctx: Contexte): Decision {
    // 1. Vérifications communes à tous les types.
    if (ctx.suspect) return aVerifier('autre', 'instructions suspectes dans le courriel');
    if (type === 'autre') return aVerifier(type, 'demande non reconnue');
    if (type === 'question_avant_achat') {
        return brouillon(type, 'question_avant_achat', 'à compléter par le conseiller');
    }
    if (ctx.numeros.length > 1) return aVerifier(type, 'plusieurs numéros de commande');
    if (ctx.numeros.length === 0) {
        return type === 'suivi'
            ? brouillon(type, 'suivi_sans_numero', 'pas de numéro de commande')
            : aVerifier(type, 'numéro de commande manquant');
    }
    if (!ctx.commande) {
        return type === 'suivi'
            ? brouillon(type, 'suivi_numero_introuvable', 'numéro inconnu')
            : aVerifier(type, 'numéro de commande inconnu');
    }
    if (ctx.commande.client.email.toLowerCase() !== ctx.expediteur.toLowerCase()) {
        return aVerifier(type, "l'expéditeur n'est pas le client de la commande");
    }

    // 2. Une règle par type.
    const commande = ctx.commande;
    switch (type) {
        case 'suivi':
            return deciderSuivi(commande, ctx.suivi);

        case 'retour_echange': {
            if (!commande.date_livraison) return escalade(type, 'commande pas encore livrée');
            const jours = joursDepuisLivraison(commande.date_livraison, ctx.dateCourriel);
            return jours <= DELAI_RETOUR_JOURS
                ? brouillon(type, 'retour_echange_dans_delai', `${jours} jours après livraison`)
                : escalade(type, `hors délai de retour : ${jours} jours après livraison`);
        }

        case 'defectueux_endommage': {
            if (!commande.date_livraison) return escalade(type, 'commande pas encore livrée');
            const jours = joursDepuisLivraison(commande.date_livraison, ctx.dateCourriel);
            return jours <= DELAI_DEFAUT_JOURS
                ? escalade(type, `défaut signalé ${jours} jours après livraison`)
                : escalade(type, `défaut signalé hors délai : ${jours} jours après livraison`);
        }

        case 'non_recu':
            return escalade(type, 'colis indiqué livré mais non reçu');
        case 'erreur_preparation':
            return escalade(type, 'erreur de préparation');
        case 'remboursement_geste':
            return escalade(type, 'remboursement ou geste commercial');
    }
}

// Règle des demandes de suivi.
function deciderSuivi(commande: Commande, suivi: Suivi | null): Decision {
    if (commande.statut === 'en préparation') {
        return brouillon('suivi', 'suivi_en_preparation', 'commande en préparation');
    }
    if (!suivi) return aVerifier('suivi', 'commande expédiée mais aucun suivi transporteur');
    if (STATUTS_NORMAUX.includes(suivi.code_statut)) {
        return brouillon('suivi', 'suivi_statut_connu', `statut transporteur : ${suivi.code_statut}`);
    }
    if (STATUTS_INCIDENT.includes(suivi.code_statut)) {
        return brouillon('suivi', 'suivi_incident', `incident transporteur : ${suivi.code_statut}`);
    }
    return aVerifier('suivi', `statut transporteur inconnu : ${suivi.code_statut}`);
}

// ---- Courriel avec plusieurs demandes (SPEC 4.4, Q5) ----

const ORDRE_PRIORITE: Priorite[] = ['basse', 'normale', 'haute'];

// Décide pour TOUT le courriel : une décision par demande, puis on garde la plus prudente.
export function deciderCourriel(types: TypeDemande[], ctx: Contexte): Decision {
    const decisions = types.map((type) => decider(type, ctx));
    if (decisions.length === 0) return aVerifier('autre', 'aucun type de demande');

    // La priorité la plus haute l'emporte.
    const priorite = decisions
        .map((d) => d.priorite)
        .reduce((a, b) => (ORDRE_PRIORITE.indexOf(a) > ORDRE_PRIORITE.indexOf(b) ? a : b));

    // Une demande remontée → tout le courriel est remonté.
    const remontee = decisions.find((d) => d.remonte);
    if (remontee) return { ...remontee, priorite };

    // Aucune remontée : il faut un seul et même brouillon, sinon un humain tranche.
    if (decisions.every((d) => d.modele === decisions[0].modele)) return { ...decisions[0], priorite };
    return aVerifier('autre', 'plusieurs demandes qui appellent des réponses différentes');
}
