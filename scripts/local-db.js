/**
 * Démarre un serveur MySQL local pour le développement, sans rien installer
 * sur la machine, et écrit la DATABASE_URL correspondante dans `.env`.
 *
 * Tant que ce processus tourne, les données survivent aux redémarrages du
 * serveur Next (contrairement au mode mémoire du projet). Elles sont en
 * revanche effacées quand on arrête ce script : relancer `npm run db:push`
 * puis le seed pour repartir d'une base propre.
 *
 * Usage : `npm run db:local` puis, dans un autre terminal, `npm run dev`.
 */
const fs = require("fs");
const path = require("path");
const { createDB } = require("mysql-memory-server");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const DB_NAME = "oxideve_local";

/** Met à jour (ou crée) la seule clé DATABASE_URL, sans toucher au reste. */
function writeDatabaseUrl(url) {
  const line = `DATABASE_URL="${url}"`;
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";

  if (/^DATABASE_URL=.*$/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, line);
  } else {
    content = content ? `${content.replace(/\s*$/, "")}\n${line}\n` : `${line}\n`;
  }

  fs.writeFileSync(ENV_PATH, content);
}

async function main() {
  console.log("Démarrage de MySQL local (le premier lancement télécharge le binaire, cela peut prendre quelques minutes)…");

  // Le port est choisi automatiquement : l'imposer fait échouer le démarrage.
  const db = await createDB({
    dbName: DB_NAME,
    username: "root",
    logLevel: "ERROR",
  });

  const url = `mysql://${db.username}@127.0.0.1:${db.port}/${db.dbName}`;
  writeDatabaseUrl(url);

  console.log(`\nMySQL écoute sur le port ${db.port}.`);
  console.log(`DATABASE_URL écrite dans .env : ${url}`);
  console.log("\nDans un autre terminal :");
  console.log("  npx prisma db push --schema prisma/schema.prisma --accept-data-loss");
  console.log("  npm run dev --prefix frontend");
  console.log("\nLaisse ce terminal ouvert. Ctrl+C pour arrêter la base.");

  const stop = async () => {
    console.log("\nArrêt de MySQL…");
    await db.stop().catch(() => undefined);
    process.exit(0);
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // Maintient le processus (et donc la base) en vie jusqu'à l'interruption.
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Échec du démarrage de la base locale :", error.message);
  process.exit(1);
});
