// Connexion à la boîte de test, partagée par les scripts.
import { ImapFlow } from 'imapflow';

export function creerClientImap(): ImapFlow {
  const { IMAP_HOTE, IMAP_PORT, IMAP_UTILISATEUR, IMAP_MOT_DE_PASSE } = process.env;
  if (!IMAP_HOTE || !IMAP_PORT || !IMAP_UTILISATEUR || !IMAP_MOT_DE_PASSE) {
    throw new Error('Variables IMAP_* manquantes : copie .env.example en .env');
  }
  return new ImapFlow({
    host: IMAP_HOTE,
    port: Number(IMAP_PORT),
    secure: false,                         // pas de TLS : acceptable UNIQUEMENT parce que tout reste sur 127.0.0.1
    auth: { user: IMAP_UTILISATEUR, pass: IMAP_MOT_DE_PASSE },
    logger: false,                         // sinon imapflow affiche tout le dialogue IMAP
  });
}
