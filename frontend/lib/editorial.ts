import type { Article } from "../../shared/types";

export const blogArticles: Article[] = [
  {
    id: "art-rge-2026",
    slug: "rge-2026-points-de-controle-chantier",
    title: "RGE 2026 : les points de controle a verifier avant ouverture chantier",
    category: "RGE",
    excerpt:
      "Une trame simple pour preparer les justificatifs, les points de vigilance et les preuves d'execution avant le passage en revue d'un chantier.",
    body: [
      "Le sujet n'est pas seulement la qualification. Le sujet est la continuite entre l'etude, la pose, le controle et la documentation finale. Une equipe qui anticipe les pieces et les preuves gagne du temps et reduit les reprises.",
      "Avant ouverture chantier, il faut verrouiller trois zones : les pre requis administratifs, la coherence technique de la solution et les controles d'execution prevus a la remise. Cette lecture evite les dossiers incomplets et les arbitrages trop tardifs.",
      "Dans les parcours Oxideve, ces points sont travailles comme une routine d'equipe : check de conformite, logistique des materiaux, points d'autocontrôle et recapitulatif exploitable par le responsable technique."
    ],
    readingTime: "4 min",
    publishedAt: "2026-04-02",
    featuredFormationSlug: "formation-qualipv"
  },
  {
    id: "art-irve-bureau-etude",
    slug: "irve-bureau-detude-et-equipe-pose",
    title: "IRVE : mieux faire circuler les decisions entre bureau d'etude et equipe de pose",
    category: "IRVE",
    excerpt:
      "Les projets IRVE se fragilisent souvent au moment du passage du dossier a l'equipe terrain. Voici les points a normaliser pour eviter les ecarts de mise en oeuvre.",
    body: [
      "Le vrai point de friction n'est pas l'equipement lui-meme. C'est le transfert de decisions : architecture retenue, protections, reserve de puissance, contraintes de site et logique de supervision.",
      "Une fiche de passage bien structuree doit indiquer la logique technique attendue, les verifications critiques a la pose et les limites a ne pas depasser. Sans cela, le chantier bascule vite dans des arbitrages locaux qui fragilisent l'ensemble.",
      "Un module court de formation permet souvent d'aligner bureau d'etude, charge d'affaires et poseurs autour d'une meme grille de lecture. C'est la difference entre une installation simplement posee et une installation vraiment exploitable."
    ],
    readingTime: "5 min",
    publishedAt: "2026-03-20",
    featuredFormationSlug: "formation-irve"
  },
  {
    id: "art-pac-mise-en-service",
    slug: "pac-mise-en-service-sans-angles-morts",
    title: "PAC : structurer la mise en service sans angle mort",
    category: "Pompes a chaleur",
    excerpt:
      "Une mise en service reussie se joue sur la preparation des relevés, des reglages et de la tracabilite. Cette note reprend la trame a imposer a l'equipe.",
    body: [
      "Les equipes gagnent rarement du temps en improvisant la mise en service. Elles gagnent du temps en standardisant ce qui doit etre releve, compare et remis en fin d'intervention.",
      "La lecture technique doit etre partagee : conditions de fonctionnement, reglages retenus, verification des debits et points d'alerte a transmettre au client ou au mainteneur. C'est cette trame qui limite les retours terrain inutiles.",
      "La formation devient alors un outil d'harmonisation. On ne forme pas seulement pour connaitre le materiel, mais pour installer une methode de verification commune a toute l'equipe."
    ],
    readingTime: "4 min",
    publishedAt: "2026-03-08",
    featuredFormationSlug: "formation-qualipac"
  }
];

export function getArticleBySlug(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}