export type StatutCommande = 'en préparation' | 'expédiée' | 'livrée';

export type Commande = {
    numero: string;
    date_commande: string;
    statut: StatutCommande;
    client: { nom: string; email: string };
    date_livraison: string | null;
    numero_suivi: string | null;
}

export type Suivi = {
    numero_suivi: string;
    statut: string;
    code_statut: string;
    derniere_etape: { date: string, lieu: string, evenement: string };
    date_estimee_livraison: string;
}

export type TypeDemande =
    | 'suivi'
    | 'retour_echange'
    | 'remboursement_geste'
    | 'defectueux_endommage'
    | 'non_recu'
    | 'erreur_preparation'
    | 'question_avant_achat'
    | 'autre';

export type Priorite = 'haute' | 'normale' | 'basse';

export type ModeleReponse =
    | 'suivi_statut_connu'
    | 'suivi_incident'
    | 'suivi_sans_numero'
    | 'suivi_numero_introuvable'
    | 'suivi_en_preparation'
    | 'retour_echange_dans_delai'
    | 'accuse_escalade'
    | 'question_avant_achat';

export type Decision = {
    priorite: Priorite;
    modele: ModeleReponse | null;
    remonte: boolean;
    raison: string;
}

