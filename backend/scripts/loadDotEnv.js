const fs = require("fs");
const path = require("path");

/**
 * Lit le .env a la racine du projet. Les scripts sont lances hors du serveur,
 * qui fait ce chargement de son cote : sans cela, DATABASE_URL manque.
 * Une variable deja definie dans l'environnement n'est jamais ecrasee.
 */
function loadDotEnv(filePath = path.join(__dirname, "..", "..", ".env")) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

module.exports = { loadDotEnv };
