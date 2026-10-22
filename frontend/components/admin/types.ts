import type { ProgrammeDay } from "../../../shared/types";

/**
 * Formulaire de formation de l'administration. Partage entre AdminWorkspace et
 * les panneaux de visuels, qui modifient l'image de banniere et ses cadrages.
 */
export type FormationDraft = {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  duration: string;
  durationDetails: string;
  location: string;
  audience: string;
  summary: string;
  description: string;
  benefits: string;
  objectives: string;
  prerequisites: string;
  modalities: string;
  programme: ProgrammeDay[];
  certification: string;
  price: string;
  priceDetails: string;
  successRate: string;
  handicapPolicy: string;
  levelLabel: string;
  subCategory: string;
  cpfEligible: boolean;
  bannerImage: string;
  bannerPosition: string;
  tilePosition: string;
};

/**
 * Formulaire d'article. Partage entre AdminWorkspace et le panneau de
 * referencement, qui edite le titre et la description Google.
 */
export type ArticleDraft = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  bodyHtml: string;
  readingTime: string;
  publishedAt: string;
  featuredFormationSlug: string;
  coverImageUrl: string;
  published: boolean;
  indexable: boolean;
  seoTitle: string;
  seoDescription: string;
};
