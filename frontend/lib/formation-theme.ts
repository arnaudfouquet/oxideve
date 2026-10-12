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

/**
 * Visuel propre à une sous-famille, quand elle en a un : il prend le pas sur
 * la bannière de la catégorie parente.
 */
// Visuels provisoires (Unsplash) en attendant les photos Oxideve définitives.
const SUBCATEGORY_BANNERS: Record<string, string> = {
  Électricité: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
  "Travail en hauteur": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80",
  "Sauveteur secouriste du travail": "https://images.unsplash.com/photo-1587556930775-8f3ac1e2a9a0?auto=format&fit=crop&w=1200&q=80",
  Incendie: "https://images.unsplash.com/photo-1599171571332-7b1a7a0b1b4f?auto=format&fit=crop&w=1200&q=80",
};

export function getCategoryTheme(category: string, subCategory?: string | null): CategoryTheme {
  const base = THEMES[category] || FALLBACK;
  const subBanner = subCategory ? SUBCATEGORY_BANNERS[subCategory] : undefined;

  return subBanner ? { ...base, banner: subBanner } : base;
}
