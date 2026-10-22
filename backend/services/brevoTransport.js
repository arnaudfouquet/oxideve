const https = require("https");

/**
 * Transport nodemailer qui passe par l'API HTTPS de Brevo au lieu du SMTP.
 *
 * Les ports SMTP (25, 465, 587, 2525) sont bloques sur certains reseaux
 * d'entreprise, ce qui rend l'envoi impossible. L'API repond sur le port 443,
 * ouvert partout, et accepte les memes messages.
 *
 * L'objet expose la meme interface que le transport SMTP (`sendMail`,
 * `verify`) : le reste du code n'a pas a savoir lequel des deux est utilise.
 */

const API_HOST = "api.brevo.com";
const API_PATH = "/v3/smtp/email";

/** "Nom <adresse>" ou "adresse" -> { name, email } attendu par l'API. */
function parseAddress(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return { name: value.name, email: value.address || value.email };
  }

  const avecNom = String(value).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  if (avecNom) {
    return { name: avecNom[1] || undefined, email: avecNom[2] };
  }

  return { email: String(value).trim() };
}

/** Accepte une adresse, une liste separee par des virgules, ou un tableau. */
function parseAddressList(value) {
  if (!value) return [];

  const brut = Array.isArray(value) ? value : String(value).split(",");

  return brut.map((item) => parseAddress(item)).filter((item) => item && item.email);
}

/**
 * Les pieces jointes du code existant sont fournies soit par chemin, soit par
 * contenu. L'API attend du base64 dans les deux cas.
 */
function buildAttachments(attachments) {
  if (!Array.isArray(attachments) || !attachments.length) return undefined;

  const fs = require("fs");
  const resultat = [];

  for (const piece of attachments) {
    try {
      const contenu = piece.content
        ? Buffer.from(piece.content)
        : piece.path
          ? fs.readFileSync(piece.path)
          : null;

      if (!contenu) continue;

      resultat.push({ name: piece.filename || "piece-jointe", content: contenu.toString("base64") });
    } catch (error) {
      console.error(`[brevoTransport] Pièce jointe ignorée : ${piece.filename || piece.path}`, error.message);
    }
  }

  return resultat.length ? resultat : undefined;
}

function appeler(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const corps = JSON.stringify(payload);

    const requete = https.request(
      {
        host: API_HOST,
        path: API_PATH,
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
          "content-length": Buffer.byteLength(corps),
        },
        timeout: 20000,
      },
      (reponse) => {
        const morceaux = [];
        reponse.on("data", (c) => morceaux.push(c));
        reponse.on("end", () => {
          const texte = Buffer.concat(morceaux).toString("utf8");

          if (reponse.statusCode >= 200 && reponse.statusCode < 300) {
            let donnees = {};
            try {
              donnees = JSON.parse(texte);
            } catch (error) {
              /* reponse vide : sans importance */
            }
            return resolve({ messageId: donnees.messageId || "brevo", response: texte });
          }

          // Le message d'erreur de Brevo est bien plus parlant que le code seul.
          const erreur = new Error(`Brevo a refusé l'envoi (${reponse.statusCode}) : ${texte.slice(0, 200)}`);
          erreur.statusCode = reponse.statusCode;
          reject(erreur);
        });
      },
    );

    requete.on("error", reject);
    requete.on("timeout", () => requete.destroy(new Error("Brevo n'a pas répondu dans le délai imparti.")));
    requete.write(corps);
    requete.end();
  });
}

/** Les images en cid: (le logo) deviennent des pieces jointes inline. */
function buildInlineImages(attachments) {
  if (!Array.isArray(attachments)) return [];

  return attachments.filter((piece) => piece.cid);
}

function createBrevoTransport(apiKey) {
  return {
    async sendMail(message) {
      const expediteur = parseAddress(message.from);
      const destinataires = parseAddressList(message.to);

      if (!destinataires.length) {
        throw new Error("Aucun destinataire pour cet email.");
      }

      // Brevo ne gere pas les images en cid: : on les retire du HTML et on
      // laisse le logo de cote plutot que d'afficher une image cassee.
      const inline = buildInlineImages(message.attachments);
      let html = message.html;

      if (html && inline.length) {
        for (const image of inline) {
          html = html.replace(new RegExp(`<img[^>]*cid:${image.cid}[^>]*>`, "gi"), "");
        }
      }

      const piecesJointes = buildAttachments(
        (message.attachments || []).filter((piece) => !piece.cid),
      );

      const payload = {
        sender: expediteur,
        to: destinataires,
        subject: message.subject,
        htmlContent: html || undefined,
        textContent: message.text || undefined,
        attachment: piecesJointes,
      };

      if (message.replyTo) payload.replyTo = parseAddress(message.replyTo);

      return appeler(payload, apiKey);
    },

    /** Verifie que la cle est acceptee, sans envoyer de message. */
    async verify() {
      return new Promise((resolve, reject) => {
        const requete = https.request(
          {
            host: API_HOST,
            path: "/v3/account",
            method: "GET",
            headers: { "api-key": apiKey, accept: "application/json" },
            timeout: 15000,
          },
          (reponse) => {
            const morceaux = [];
            reponse.on("data", (c) => morceaux.push(c));
            reponse.on("end", () => {
              const texte = Buffer.concat(morceaux).toString("utf8");

              if (reponse.statusCode === 200) return resolve(true);

              reject(new Error(`Brevo a refusé la clé (${reponse.statusCode}) : ${texte.slice(0, 200)}`));
            });
          },
        );

        requete.on("error", reject);
        requete.on("timeout", () => requete.destroy(new Error("Brevo n'a pas répondu.")));
        requete.end();
      });
    },
  };
}

module.exports = { createBrevoTransport };
