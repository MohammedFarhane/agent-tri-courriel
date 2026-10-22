// Dépose les 25 fichiers .eml dans la boîte de réception (commande IMAP APPEND).
// Rien n'est envoyé : on range directement les messages dans INBOX, en-têtes d'origine intacts.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { creerClientImap } from './connexion-imap.ts';

const DOSSIER = 'datas/boite_test';

const client = creerClientImap();
await client.connect();
try {
  // Idempotence : si la boîte contient déjà des messages, on ne les dépose pas une 2e fois.
  const etat = await client.status('INBOX', { messages: true });
  if (!etat) throw new Error('INBOX introuvable sur le serveur IMAP');
  if (etat.messages) {
    console.log(`INBOX contient déjà ${etat.messages} message(s) : rien à faire.`);
  } else {
    const fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith('.eml')).sort();
    for (const fichier of fichiers) {
      const brut = await readFile(join(DOSSIER, fichier));
      // Date de réception IMAP = date de l'en-tête « Date: », pour que le tri « plus ancien d'abord » soit réaliste.
      const date = brut.toString('utf8').match(/^Date: (.+)$/m)?.[1];
      await client.append('INBOX', brut, [], date ? new Date(date) : undefined);
      console.log(`déposé : ${fichier}`);
    }
    console.log(`${fichiers.length} courriel(s) déposé(s) dans INBOX.`);
  }
} finally {
  await client.logout();
}
