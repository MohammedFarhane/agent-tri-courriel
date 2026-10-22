// Liste la boîte du plus ancien au plus récent : c'est l'ordre dans lequel l'agent traitera les courriels.
import { creerClientImap } from './connexion-imap.ts';
import type { FetchMessageObject } from 'imapflow';

const client = creerClientImap();
await client.connect();
const verrou = await client.getMailboxLock('INBOX');   // sélectionne INBOX pendant la lecture
try {
  // `envelope` = en-têtes déjà décodés par imapflow (les =?utf-8?q?…?= deviennent lisibles).
  const messages: FetchMessageObject[] = [];
  for await (const m of client.fetch('1:*', { envelope: true, internalDate: true })) {
    messages.push(m);
  }
  // La date peut arriver en texte ou en objet Date : on normalise toujours en Date.
  const dateDe = (m: (typeof messages)[number]) => new Date(m.envelope?.date ?? 0);
  messages.sort((a, b) => dateDe(a).getTime() - dateDe(b).getTime());

  for (const m of messages) {
    const date = dateDe(m).toISOString().slice(0, 16).replace('T', ' ');
    const de = m.envelope?.from?.[0]?.address;
    console.log(`${date}  ${de?.padEnd(32)}  ${m.envelope?.subject}`);
  }
  console.log(`\n${messages.length} message(s) dans INBOX.`);
} finally {
  verrou.release();
  await client.logout();
}
