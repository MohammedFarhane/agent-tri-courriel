// Démarre GreenMail : un serveur IMAP de TEST qui garde les courriels en mémoire.
// À chaque redémarrage, la boîte est vide → relancer `npm run imap:remplir`.
import { spawn } from 'node:child_process';

const JAR = 'outils/greenmail/greenmail-standalone-2.1.14.jar';
const { IMAP_UTILISATEUR, IMAP_MOT_DE_PASSE, IMAP_ADRESSE } = process.env;

if (!IMAP_UTILISATEUR || !IMAP_MOT_DE_PASSE || !IMAP_ADRESSE) {
  console.error('Variables IMAP_* manquantes : copie .env.example en .env');
  process.exit(1);
}
const domaine = IMAP_ADRESSE.split('@')[1];

const options = [
  '-Dgreenmail.setup.test.imap',            // IMAP seulement, port de test 3143 (pas de SMTP : rien ne s'envoie)
  '-Dgreenmail.hostname=127.0.0.1',         // écoute uniquement sur ta machine, pas sur le réseau
  `-Dgreenmail.users=${IMAP_UTILISATEUR}:${IMAP_MOT_DE_PASSE}@${domaine}`,
  '-Dgreenmail.api.hostname=127.0.0.1',     // petite API d'administration de GreenMail…
  '-Dgreenmail.api.port=8090',              // …déplacée pour libérer 8080
  '-jar', JAR,
];

console.log('Démarrage de GreenMail sur 127.0.0.1:3143 (Ctrl+C pour arrêter)…');
// Tableau d'arguments, pas de shell : aucune valeur ne peut être interprétée comme une commande.
const java = spawn('java', options, { stdio: 'inherit' });
java.on('exit', (code) => process.exit(code ?? 0));
