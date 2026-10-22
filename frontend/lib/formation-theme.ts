/**
 * Visuels associés à chaque catégorie de formation : bannière de la page
 * détail et accroche affichée sur la page catalogue. Les catégories inconnues
 * retombent sur un visuel par défaut plutôt que de casser la page.
 */
export type CategoryTheme = {
  banner: string;
  blurb: string;
  /** Cadrage de la bannière de la page formation (CSS `object-position`). */
  bannerPosition?: string;
  /** Cadrage de la photo dans la tuile du catalogue (CSS `object-position`). */
  tilePosition?: string;
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
  "Fluides frigorigènes": {
    banner: "/assets/formations/banner-clim.webp",
    blurb:
      "Climatisation et fluides frigorigènes : intervenez en conformité sur les équipements de climatisation et de réfrigération.",
  },
  // Visuels provisoires (Unsplash) : ces trois categories n'avaient pas de
  // banniere et reprenaient celle de la securite, hors sujet.
  Accompagnement: {
    banner: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    bannerPosition: "50% 45%",
    tilePosition: "50% 40%",
    blurb:
      "Bilan de compétences, VAE, orientation : faites le point sur votre parcours et construisez la suite avec un accompagnement individuel.",
  },
  "Chauffage bois": {
    banner: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1600&q=80",
    bannerPosition: "50% 50%",
    tilePosition: "50% 45%",
    blurb:
      "Installez et entretenez les appareils de chauffage au bois dans le respect des règles de l'art et des exigences de qualification.",
  },
  Commerce: {
    banner: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    bannerPosition: "50% 45%",
    tilePosition: "50% 40%",
    blurb:
      "Développez vos techniques de vente, la relation client et la négociation pour gagner en efficacité commerciale.",
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
// Les deux formats n'ont pas le même cadrage : la bannière de la page formation
// est très large et basse, la tuile du catalogue est presque carrée. Chacun a
// donc son réglage par défaut, surchargeable formation par formation.
const SUBCATEGORY_BANNERS: Record<string, { url: string; banner: string; tile: string }> = {
  Électricité: {
    url: "https://images.unsplash.com/photo-1565608438257-fac3c27beb36?auto=format&fit=crop&w=1200&q=80",
    banner: "50% 50%",
    tile: "50% 50%",
  },
  "Travail en hauteur": {
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
    banner: "50% 40%",
    tile: "50% 35%",
  },
  "Sauveteur secouriste du travail": {
    url: "https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?auto=format&fit=crop&w=1600&q=80",
    banner: "50% 45%",
    tile: "50% 40%",
  },
  Incendie: {
    url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1600&q=80",
    banner: "50% 50%",
    tile: "50% 45%",
  },
  // Image Oxideve deja presente : inutile d'aller chercher une photo libre.
  Climatisation: {
    url: "/assets/formations/banner-clim.webp",
    banner: "50% 50%",
    tile: "50% 45%",
  },
  Conduite: {
    url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80",
    banner: "50% 50%",
    tile: "50% 45%",
  },
  "Gestes et postures": {
    url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=80",
    banner: "50% 45%",
    tile: "50% 40%",
  },
};

/** Visuel saisi dans l'admin pour une catégorie ou une sous-catégorie. */
export type CategoryVisual = {
  scope: "category" | "subCategory";
  name: string;
  image?: string | null;
  bannerPosition?: string | null;
  tilePosition?: string | null;
};

/** Index des visuels admin, par portée et libellé, pour un accès direct. */
export function indexCategoryVisuals(visuals: CategoryVisual[]): Record<string, CategoryVisual> {
  const index: Record<string, CategoryVisual> = {};
  visuals.forEach((visual) => {
    index[`${visual.scope}:${visual.name}`] = visual;
  });
  return index;
}

/**
 * Visuel à afficher pour une formation, du plus précis au plus général :
 * réglage de la formation, puis visuel admin de la sous-catégorie, puis valeur
 * codée de la sous-catégorie, puis visuel admin de la catégorie, puis valeur
 * codée de la catégorie. `bannerPosition` sert à la page formation,
 * `tilePosition` à la tuile du catalogue : les deux sont indépendants.
 */
export function getCategoryTheme(
  category: string,
  subCategory?: string | null,
  overrides?: { bannerImage?: string | null; bannerPosition?: string | null; tilePosition?: string | null },
  visuals?: Record<string, CategoryVisual>,
): CategoryTheme {
  const base = THEMES[category] || FALLBACK;
  const sub = subCategory ? SUBCATEGORY_BANNERS[subCategory] : undefined;

  const adminSub = subCategory ? visuals?.[`subCategory:${subCategory}`] : undefined;
  const adminCategory = visuals?.[`category:${category}`];

  // Première valeur non vide de la liste, du plus précis au plus général.
  const pick = (...values: (string | null | undefined)[]) => values.find((value) => value) || undefined;

  return {
    ...base,
    banner:
      pick(overrides?.bannerImage, adminSub?.image, sub?.url, adminCategory?.image, base.banner) || base.banner,
    bannerPosition: pick(
      overrides?.bannerPosition,
      adminSub?.bannerPosition,
      sub?.banner,
      adminCategory?.bannerPosition,
      base.bannerPosition,
    ),
    tilePosition: pick(
      overrides?.tilePosition,
      adminSub?.tilePosition,
      sub?.tile,
      adminCategory?.tilePosition,
      base.tilePosition,
    ),
  };
}
