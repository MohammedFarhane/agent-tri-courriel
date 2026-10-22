// Lecture de la boîte IMAP : renvoie les courriels du plus ancien au plus récent.
import { creerClientImap } from '../scripts/connexion-imap.ts';

export type Courriel = { id: string; expediteur: string; nom: string; objet: string; date: Date; texte: string };

export async function lireCourriels(): Promise<Courriel[]> {
    const client = creerClientImap();
    await client.connect();
    const verrou = await client.getMailboxLock('INBOX');
    const courriels: Courriel[] = [];
    try {
        for await (const m of client.fetch('1:*', { uid: true, envelope: true, source: true })) {
            courriels.push({
                id: `courriel-uid-${m.uid}`,
                expediteur: m.envelope?.from?.[0]?.address ?? '',
                nom: m.envelope?.from?.[0]?.name ?? '',
                objet: m.envelope?.subject ?? '',
                date: new Date(m.envelope?.date ?? 0),
                // le texte = tout ce qui suit la première ligne vide (après les en-têtes)
                texte: (m.source?.toString('utf8') ?? '').split(/\r?\n\r?\n/).slice(1).join('\n\n').trim(),
            });
        }
    } finally {
        verrou.release();
        await client.logout();
    }
    return courriels.sort((a, b) => a.date.getTime() - b.date.getTime());
}
