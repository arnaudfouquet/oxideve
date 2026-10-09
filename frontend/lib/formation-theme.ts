/**
 * Visuels associés à chaque catégorie de formation : bannière de la page
 * détail et accroche affichée sur la page catalogue. Les catégories inconnues
 * retombent sur un visuel par défaut plutôt que de casser la page.
 */
export type CategoryTheme = {
  banner: string;
  blurb: string;
};

const THEMES: Record<string, CategoryTheme> = {
  "Bornes de recharge": {
    banner: "/assets/formations/banner-irve.webp",
    blurb:
      "Découvrez nos formations IRVE pour apprendre à installer et mettre en service des infrastructures de recharge pour véhicules électriques.",
  },
  Bureautique: {
    banner: "/assets/formations/banner-bureautique.webp",
    blurb:
      "Gagnez en efficacité au quotidien avec nos formations bureautiques, adaptées à votre niveau et à vos usages professionnels.",
  },
  Management: {
    banner: "/assets/formations/banner-management.webp",
    blurb:
      "Développez vos pratiques managériales : animation d'équipe, communication et pilotage de l'activité au quotidien.",
  },
  Photovoltaïque: {
    banner: "/assets/formations/banner-photovoltaique.webp",
    blurb:
      "Maîtrisez la conception, la pose et la mise en service d'installations photovoltaïques conformes aux exigences en vigueur.",
  },
  "Pompes à chaleur": {
    banner: "/assets/formations/banner-pompe-chaleur.webp",
    blurb:
      "Formez-vous au dimensionnement, à l'installation et à la mise en service des pompes à chaleur.",
  },
  "Sécurité au travail": {
    banner: "/assets/formations/banner-securite.webp",
    blurb:
      "Sécurisez vos interventions et répondez à vos obligations réglementaires avec nos formations sécurité.",
  },
  "Traitement d'air": {
    banner: "/assets/formations/banner-clim.webp",
    blurb:
      "Climatisation et fluides frigorigènes : intervenez en conformité sur les équipements de traitement d'air.",
  },
};

const FALLBACK: CategoryTheme = {
  banner: "/assets/formations/banner-securite.webp",
  blurb: "Découvrez nos formations professionnelles conçues pour la réalité du terrain.",
};

export function getCategoryTheme(category: string): CategoryTheme {
  return THEMES[category] || FALLBACK;
}
