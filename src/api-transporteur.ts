// API locale qui simule le transporteur.
import { createServer, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';

const HOTE = '127.0.0.1';
const PORT = 3000;

// 1. Lecture du fichier UNE fois, au démarrage.
const donnees = JSON.parse(readFileSync('datas/suivi_transporteur.json', 'utf8'));

// 2. Une Map : numéro de suivi → infos du colis.
const suivis = new Map();
for (const suivi of donnees.suivis) {
    suivis.set(suivi.numero_suivi, suivi);
}
console.log(`${suivis.size} colis chargés`);

// Petite fonction pour ne pas répéter writeHead + end partout.
function repondre(res: ServerResponse, statut: number, corps: unknown) {
    res.writeHead(statut, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(corps));
}

const serveur = createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // 3. On ne répond qu'aux lectures (GET) sur /suivi/...
    const morceaux = (req.url ?? '').split('/');      // "/suivi/ETX261002BE" → ["", "suivi", "ETX261002BE"]
    if (req.method !== 'GET' || morceaux.length !== 3 || morceaux[1] !== 'suivi') {
        return repondre(res, 404, { erreur: 'route inconnue' });
    }

    // 4. Validation du format AVANT toute recherche.
    const numero = morceaux[2];
    if (!/^ETX\d{6}BE$/.test(numero)) {
        return repondre(res, 400, { erreur: 'numéro de suivi invalide' });
    }

    // 5. Recherche dans la Map.
    const suivi = suivis.get(numero);
    if (!suivi) {
        return repondre(res, 404, { erreur: 'colis inconnu' });
    }
    return repondre(res, 200, suivi);
});

serveur.listen(PORT, HOTE, () => {
    console.log(`API transporteur sur http://${HOTE}:${PORT}`);
});