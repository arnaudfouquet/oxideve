export type Formation = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  duration: string;
  location: string;
  audience: string;
  summary: string;
  description: string;
  benefits: string[];
  objectives: string[];
  price: string;
  seoTitle: string;
  seoDescription: string;
};

export type Session = {
  id: string;
  formationSlug: string;
  city: string;
  startDate: string;
  endDate: string;
  seatsLeft: number;
  mode: string;
};

export type CatalogData = {
  formations: Formation[];
  sessions: Session[];
};
