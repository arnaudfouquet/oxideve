/**
 * Génération des adresses d'articles.
 *
 * Le retrait des accents utilise une table de correspondance explicite plutôt
 * qu'une translittération système : celle-ci donne des résultats différents
 * selon la plateforme (« révision » devenait « r-evision » sur Windows), et une
 * adresse doit être identique partout.
 */

const ACCENTS = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a",
  è: "e", é: "e", ê: "e", ë: "e",
  ì: "i", í: "i", î: "i", ï: "i",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ý: "y", ÿ: "y",
  ñ: "n", ç: "c",
  œ: "oe", æ: "ae",
  ß: "ss",
  "°": "", "€": "euro", "'": "-", "’": "-",
};

function removeAccents(value) {
  return value
    .split("")
    .map((character) => {
      const lower = character.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(ACCENTS, lower)) {
        return ACCENTS[lower];
      }
      return character;
    })
    .join("");
}

/** "Révision 2026 !" -> "revision-2026" */
function slugify(value) {
  return removeAccents(String(value || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110)
    .replace(/-+$/g, "");
}

/**
 * Rend l'adresse unique en suffixant -2, -3… si besoin.
 * `existing` est l'ensemble des slugs déjà utilisés.
 */
function uniqueSlug(value, existing) {
  const base = slugify(value) || "article";
  const taken = existing instanceof Set ? existing : new Set(existing || []);

  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix++;
  }

  return `${base}-${suffix}`;
}

module.exports = { slugify, uniqueSlug, removeAccents };
