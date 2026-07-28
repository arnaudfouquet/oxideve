export type ProgrammeSequence = {
  title: string;
  points: string[];
};

export type ProgrammeDay = {
  title: string;
  sequences: ProgrammeSequence[];
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export type RgeBadge = {
  label: string;
  imageUrl: string;
};

export type FormationStats = {
  participantsLastYear?: number;
  successCount?: number;
};

export type RelatedFormationLink = {
  label: string;
  slug: string;
};

export type Formation = {
  id: string;
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
  benefits: string[];
  objectives: string[];
  prerequisites: string[];
  modalities: string[];
  /** Programme structuré (jour → séquences → points). */
  programme: ProgrammeDay[];
  certification: string;
  price: string;
  priceDetails: string;
  successRate: string;
  handicapPolicy: string;
  queovalIdentFOR?: string | null;
  videoUrl?: string | null;
  rgeBadge?: RgeBadge | null;
  priceMemberLabel?: string | null;
  priceMember?: string | null;
  memberProgram?: { name: string; description: string; logoUrl?: string } | null;
  faq?: FaqEntry[];
  stats?: FormationStats | null;
  gallery?: string[];
  relatedSlugs?: RelatedFormationLink[];
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

export type PendingSyncSession = {
  id: string;
  externalId: string;
  externalTitle: string;
  city: string | null;
  startDate: string;
  endDate: string;
  seatsLeft: number;
  externalState: string;
};

export type Registration = {
  id: string;
  companyId?: string | null;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  formationSlug: string;
  sessionId: string;
  message?: string | null;
  createdAt: string;
  source?: string;
};

export type Company = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: string;
  owner?: string;
  notes: string;
  nextFollowUpAt?: string;
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmTask = {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmInteraction = {
  id: string;
  companyId: string;
  type: string;
  channel?: string;
  summary: string;
  owner?: string;
  occurredAt: string;
  createdAt: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string[];
  readingTime: string;
  publishedAt: string;
  featuredFormationSlug?: string;
};

export type CatalogData = {
  formations: Formation[];
  sessions: Session[];
  articles?: Article[];
};
