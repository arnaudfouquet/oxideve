/**
 * Nettoyage du HTML produit par l'éditeur d'articles.
 *
 * Le contenu vient d'un éditeur riche : il CONTIENT du HTML, on ne peut donc
 * pas tout échapper à l'affichage. La méthode retenue est volontairement
 * contre-intuitive mais sûre par construction :
 *
 *   1. on échappe l'intégralité du contenu, plus aucune balise n'existe ;
 *   2. on restaure UNIQUEMENT les balises de la liste blanche, une par une.
 *
 * Tout ce qui n'a pas été explicitement autorisé reste donc du texte inerte.
 */

/** Balises simples autorisées, sans aucun attribut. */
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote"];

/** Préfixe imposé aux images : elles doivent être hébergées par le site. */
const IMAGE_PREFIXES = ["/uploads/", "/assets/"];

/** Largeurs acceptées pour une image, en pourcentage. */
const IMAGE_WIDTHS = new Set(["25", "50", "75", "100"]);

/**
 * Décode les entités avant échappement. Sans cette étape, une apostrophe déjà
 * encodée ressortirait doublement échappée (`&amp;#39;`) et s'afficherait en
 * clair dans l'article.
 */
function decodeEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Un lien n'est accepté que vers une destination connue. Le protocole relatif
 * `//` est refusé : il pointe vers un autre domaine tout en ressemblant à un
 * lien interne.
 */
function isAllowedHref(href) {
  if (!href) return false;
  if (href.startsWith("//")) return false;

  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    href.startsWith("https://")
  );
}

/** Une image doit être hébergée sur le site, et ne jamais remonter l'arborescence. */
function isAllowedImageSrc(src) {
  if (!src) return false;
  if (src.includes("..")) return false;

  return IMAGE_PREFIXES.some((prefix) => src.startsWith(prefix));
}

/**
 * Récupère la valeur d'un attribut dans une balise déjà échappée. Après
 * échappement les guillemets sont devenus `&quot;`, la valeur peut donc
 * contenir des `&` : on borne sur le guillemet échappé, pas sur `&`.
 */
function readAttribute(tag, name) {
  const quoted = new RegExp(`${name}\\s*=\\s*&quot;([\\s\\S]*?)&quot;`, "i");
  const bare = new RegExp(`${name}\\s*=\\s*([^\\s&]+)`, "i");

  const match = tag.match(quoted) || tag.match(bare);
  return match ? match[1] : "";
}

/**
 * Reconstruit un bloc de mise en page (galerie, image + texte) à partir de ses
 * seules données utiles. On ne « nettoie » jamais le HTML d'origine : on le
 * réécrit, ce qui rend impossible le passage d'un attribut inattendu.
 */
function rebuildLayoutBlock(escapedBlock) {
  const layout = (readAttribute(escapedBlock, "data-layout") || "").replace(/[^a-z0-9-]/gi, "");
  if (!layout) return "";

  const images = [];
  const imageRegex = /&lt;img\b[^&]*?src=(?:&quot;|")([^&"]*)(?:&quot;|")[^&]*?&gt;/gi;
  let match;

  while ((match = imageRegex.exec(escapedBlock))) {
    const src = decodeEntities(match[1]);
    if (isAllowedImageSrc(src)) {
      images.push(`<img src="${escapeHtml(src)}" alt="" loading="lazy" />`);
    }
  }

  // Titre et paragraphes éventuels du bloc « image + texte ».
  const heading = [...escapedBlock.matchAll(/&lt;h3&gt;([\s\S]*?)&lt;\/h3&gt;/gi)]
    .map((item) => `<h3>${item[1]}</h3>`)
    .join("");
  const paragraphs = [...escapedBlock.matchAll(/&lt;p&gt;([\s\S]*?)&lt;\/p&gt;/gi)]
    .map((item) => `<p>${item[1]}</p>`)
    .join("");

  // Bouton d'appel à l'action : on ne garde que la destination et le libellé,
  // en passant par la même liste blanche que les liens ordinaires.
  const links = [
    ...escapedBlock.matchAll(/&lt;a\b((?:(?!&gt;)[\s\S])*?)&gt;([\s\S]*?)&lt;\/a&gt;/gi),
  ]
    .map((item) => {
      const href = decodeEntities(readAttribute(item[1], "href"));
      if (!isAllowedHref(href)) return "";

      const label = item[2].replace(/&lt;[\s\S]*?&gt;/g, "").trim();
      if (!label) return "";

      const external = href.startsWith("https://");
      const extra = external ? ' target="_blank" rel="noopener noreferrer"' : "";

      return `<a href="${escapeHtml(href)}"${extra}>${label}</a>`;
    })
    .join("");

  if (!images.length && !heading && !paragraphs && !links) return "";

  return `<div class="article-block article-block-${escapeHtml(layout)}">${images.join("")}${heading}${paragraphs}${links}</div>`;
}

/**
 * Nettoie le HTML d'un article et renvoie une chaîne sûre à afficher.
 */
function sanitizeArticleHtml(input) {
  if (typeof input !== "string" || !input.trim()) return "";

  // 1. Tout échapper : plus aucune balise n'existe à ce stade.
  let output = escapeHtml(decodeEntities(input));

  // 2. Restaurer les blocs de mise en page, reconstruits de zéro.
  output = output.replace(
    /&lt;div\b(?:(?!&gt;)[\s\S])*?data-layout[\s\S]*?&lt;\/div&gt;/gi,
    (block) => rebuildLayoutBlock(block),
  );

  // 3. Restaurer les images isolées, avec leur seule largeur autorisée.
  output = output.replace(/&lt;img\b((?:(?!&gt;)[\s\S])*?)&gt;/gi, (tag, attributes) => {
    const src = decodeEntities(readAttribute(attributes, "src"));
    if (!isAllowedImageSrc(src)) return "";

    const width = readAttribute(attributes, "width");
    const widthAttribute = IMAGE_WIDTHS.has(width) ? ` width="${width}%"` : "";

    return `<img src="${escapeHtml(src)}" alt=""${widthAttribute} loading="lazy" />`;
  });

  // 4. Restaurer les liens autorisés. La balise peut porter d'autres attributs
  //    (target, rel…) : on les ignore et on ne garde que href.
  output = output.replace(/&lt;a\b((?:(?!&gt;)[\s\S])*?)&gt;/gi, (tag, attributes) => {
    const href = decodeEntities(readAttribute(attributes, "href"));
    if (!isAllowedHref(href)) return "";

    // Sans rel="noopener", la page ouverte peut manipuler la page d'origine.
    const external = href.startsWith("https://");
    const extra = external ? ' target="_blank" rel="noopener noreferrer"' : "";

    return `<a href="${escapeHtml(href)}"${extra}>`;
  });
  // Une fermeture n'est restaurée que si un lien a effectivement été ouvert
  // avant elle : un lien refusé ne doit pas laisser de `</a>` orphelin.
  let openLinks = 0;
  output = output.replace(/(<a\b[^>]*>)|&lt;\/a&gt;/gi, (fragment) => {
    if (fragment.toLowerCase().startsWith("<a")) {
      openLinks++;
      return fragment;
    }

    if (openLinks > 0) {
      openLinks--;
      return "</a>";
    }

    return "";
  });

  // 5. Restaurer les balises simples de la liste blanche, sans attribut.
  ALLOWED_TAGS.forEach((tag) => {
    output = output.replace(
      new RegExp(`&lt;${tag}(?:\\s(?:(?!&gt;)[\\s\\S])*?)?\\s*/?&gt;`, "gi"),
      `<${tag}>`,
    );
    output = output.replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`);
  });

  return output.trim();
}

/**
 * Texte brut d'un article, pour l'extrait et le temps de lecture.
 * On décode les entités : ce texte est affiché par React, qui l'échappe à son
 * tour. Sans décodage, une apostrophe ressortirait en `&amp;#39;` à l'écran.
 */
function htmlToPlainText(html) {
  const withoutTags = sanitizeArticleHtml(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

module.exports = {
  sanitizeArticleHtml,
  htmlToPlainText,
};
