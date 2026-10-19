/**
 * Visuels associés à chaque catégorie de formation : bannière de la page
 * détail et accroche affichée sur la page catalogue. Les catégories inconnues
 * retombent sur un visuel par défaut plutôt que de casser la page.
 */
export type CategoryTheme = {
  banner: string;
  blurb: string;
  /** Cadrage de la photo, au format CSS `object-position`. */
  bannerPosition?: string;
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
// `position` donne le cadrage par défaut, que l'admin peut surcharger formation
// par formation via le champ "cadrage de la photo".
const SUBCATEGORY_BANNERS: Record<string, { url: string; position: string }> = {
  Électricité: {
    url: "https://images.unsplash.com/photo-1565608438257-fac3c27beb36?auto=format&fit=crop&w=1200&q=80",
    position: "50% 50%",
  },
  "Travail en hauteur": {
    url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
    position: "50% 40%",
  },
  "Sauveteur secouriste du travail": {
    url: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
    position: "50% 45%",
  },
  Incendie: {
    url: "https://images.unsplash.com/photo-1599045118108-bf9954418b76?auto=format&fit=crop&w=1200&q=80",
    position: "50% 50%",
  },
};

/**
 * Visuel à afficher pour une formation. L'ordre de priorité est : photo saisie
 * dans l'admin, puis photo de la sous-famille, puis photo de la catégorie.
 */
export function getCategoryTheme(
  category: string,
  subCategory?: string | null,
  overrides?: { bannerImage?: string | null; bannerPosition?: string | null },
): CategoryTheme {
  const base = THEMES[category] || FALLBACK;
  const sub = subCategory ? SUBCATEGORY_BANNERS[subCategory] : undefined;

  const banner = overrides?.bannerImage || sub?.url || base.banner;
  const bannerPosition = overrides?.bannerPosition || sub?.position || base.bannerPosition;

  return { ...base, banner, bannerPosition };
}
