/**
 * Tests du filtre de sécurité des articles.
 * Lancer avec : node backend/scripts/testArticleSanitizer.js
 */
const { sanitizeArticleHtml } = require("../services/articleSanitizer");

let passed = 0;
let failed = 0;

/** La sortie ne doit contenir AUCUN des fragments interdits. */
function refuse(label, input, forbidden) {
  const output = sanitizeArticleHtml(input);
  const found = forbidden.filter((fragment) => output.toLowerCase().includes(fragment.toLowerCase()));

  if (found.length) {
    failed++;
    console.log(`ECHEC  ${label}`);
    console.log(`       entrée  : ${input}`);
    console.log(`       sortie  : ${output}`);
    console.log(`       interdit: ${found.join(", ")}`);
  } else {
    passed++;
    console.log(`OK     ${label}`);
    console.log(`       -> ${output || "(vide)"}`);
  }
}

/** La sortie doit contenir chacun des fragments attendus. */
function accepte(label, input, expected) {
  const output = sanitizeArticleHtml(input);
  const missing = expected.filter((fragment) => !output.includes(fragment));

  if (missing.length) {
    failed++;
    console.log(`ECHEC  ${label}`);
    console.log(`       entrée : ${input}`);
    console.log(`       sortie : ${output}`);
    console.log(`       manque : ${missing.join(", ")}`);
  } else {
    passed++;
    console.log(`OK     ${label}`);
  }
}

console.log("=== Entrées malveillantes : doivent ressortir inoffensives ===\n");

refuse("script inline", "<script>alert(1)</script>", ["<script", "</script>"]);
refuse("onerror sur image", '<img src=x onerror=alert(1)>', ["onerror", "<img"]);
refuse("lien javascript:", '<a href="javascript:alert(1)">X</a>', ["javascript:", "<a href"]);
refuse("protocole relatif", '<a href="//evil.com">X</a>', ["evil.com", "<a href"]);
refuse("traversée de répertoire", '<img src="/assets/img/../../../etc/passwd">', ["..", "passwd"]);
refuse(
  "galerie avec image externe",
  '<div class="galerie" data-layout="2"><img src="https://evil.com/pixel.gif"></div>',
  ["evil.com"],
);
refuse("attribut onmouseover", '<p onmouseover="alert(1)">texte</p>', ["onmouseover", "alert"]);
// Pour ces trois cas, la balise reste entièrement échappée : elle s'affiche
// comme du texte inerte. On vérifie donc qu'aucune balise vivante ne sort,
// pas l'absence de la chaîne elle-même.
refuse("balise style", "<style>body{display:none}</style>", ["<style"]);
refuse("iframe", '<iframe src="https://evil.com"></iframe>', ["<iframe"]);
refuse("svg avec onload", "<svg onload=alert(1)></svg>", ["<svg"]);
refuse("image en data: URI", '<img src="data:text/html;base64,PHNjcmlwdD4=">', ["data:", "<img"]);
refuse("lien vers un autre domaine en http", '<a href="http://evil.com">X</a>', ["<a href", "evil.com"]);

console.log("\n=== Contenu légitime : doit être conservé ===\n");

accepte("paragraphe et gras", "<p>Bonjour <strong>le monde</strong></p>", ["<p>", "<strong>", "le monde"]);
accepte("titres et listes", "<h2>Titre</h2><ul><li>Un</li><li>Deux</li></ul>", ["<h2>", "<ul>", "<li>", "Deux"]);
accepte("lien interne", '<a href="/contact">Contact</a>', ['<a href="/contact">', "Contact"]);
accepte("lien externe sécurisé", '<a href="https://oxideve.com">Site</a>', ['rel="noopener noreferrer"', 'target="_blank"']);
accepte("lien mailto", '<a href="mailto:contact@oxideve.com">Mail</a>', ["mailto:contact@oxideve.com"]);
accepte("image hébergée avec largeur", '<img src="/uploads/articles/photo.webp" width="50">', [
  '/uploads/articles/photo.webp',
  'width="50%"',
]);
accepte("largeur non autorisée ignorée", '<img src="/uploads/articles/photo.webp" width="37">', [
  "/uploads/articles/photo.webp",
]);
accepte("galerie interne reconstruite", '<div data-layout="2"><img src="/uploads/articles/a.webp"><img src="/uploads/articles/b.webp"></div>', [
  "article-block-2",
  "/uploads/articles/a.webp",
  "/uploads/articles/b.webp",
]);
accepte("bloc image + texte", '<div data-layout="texte-droite"><img src="/uploads/articles/a.webp"><h3>Titre</h3><p>Corps</p></div>', [
  "article-block-texte-droite",
  "<h3>Titre</h3>",
  "<p>Corps</p>",
]);

console.log("\n=== Cas limites signalés comme pièges ===\n");

accepte("apostrophe non doublement échappée", "<p>L'électricité</p>", ["L&#39;électricité"]);
refuse("apostrophe pas en &amp;#39;", "<p>L'électricité</p>", ["&amp;#39;"]);
accepte("lien avec target préexistant conservé", '<a href="/contact" target="_blank">X</a>', ['<a href="/contact">']);
accepte("liste imbriquée à plat", "<ul><li>A</li></ul><ol><li>B</li></ol>", ["<ul>", "<ol>", "<li>A</li>"]);

console.log(`\n===========================================`);
console.log(`Tests réussis : ${passed} | échecs : ${failed}`);
console.log(`===========================================`);

process.exit(failed ? 1 : 0);
