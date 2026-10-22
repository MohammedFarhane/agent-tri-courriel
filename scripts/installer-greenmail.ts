// Télécharge GreenMail (serveur IMAP de test) dans outils/greenmail/ et vérifie son empreinte SHA-1.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const VERSION = '2.1.14';
const URL_JAR = `https://repo1.maven.org/maven2/com/icegreen/greenmail-standalone/${VERSION}/greenmail-standalone-${VERSION}.jar`;
const SHA1_ATTENDU = '0cb7511420b76f63c6ed437088149dc8f7fc3a08';   // empreinte publiée par Maven Central
const DESTINATION = `outils/greenmail/greenmail-standalone-${VERSION}.jar`;

if (existsSync(DESTINATION)) {
    console.log(`GreenMail est déjà installé : ${DESTINATION}`);
} else {
    console.log(`Téléchargement de GreenMail ${VERSION}…`);
    const reponse = await fetch(URL_JAR);
    if (!reponse.ok) throw new Error(`téléchargement impossible (erreur ${reponse.status})`);
    const contenu = Buffer.from(await reponse.arrayBuffer());

    // On refuse un fichier dont l'empreinte ne correspond pas : il aurait été altéré.
    const sha1 = createHash('sha1').update(contenu).digest('hex');
    if (sha1 !== SHA1_ATTENDU) throw new Error(`empreinte inattendue (${sha1}) : fichier refusé`);

    mkdirSync('outils/greenmail', { recursive: true });
    writeFileSync(DESTINATION, contenu);
    console.log(`GreenMail installé : ${DESTINATION}`);
}
