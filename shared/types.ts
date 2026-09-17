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
  mode: string;
};

export type PendingSyncSession = {
  id: string;
  externalId: string;
  externalTitle: string;
  city: string | null;
  startDate: string;
  endDate: string;
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
  status: string;
  createdAt: string;
  source?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export type LearnerInput = {
  fullName: string;
  role?: string;
  phone?: string;
  birthDate?: string;
  hasDisability: boolean;
  disabilityDetails?: string;
};

export type BulletinInscriptionInput = {
  formationSlug: string;
  sessionId?: string;
  sessionDates?: string;
  sessionLocation?: string;
  source?: string;
  distributorName?: string;
  companyName: string;
  siret?: string;
  apeCode?: string;
  companyAddress?: string;
  sponsorFullName: string;
  sponsorRole?: string;
  sponsorEmail: string;
  sponsorPhone: string;
  learners: LearnerInput[];
};

export type BulletinInscription = BulletinInscriptionInput & {
  id: string;
  status: string;
  confirmationEmailSentAt?: string | null;
  createdAt: string;
};

export type QuizAnswerOption = {
  label: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  domain: string;
  question: string;
  options: QuizAnswerOption[];
  note?: string;
};

export type QuizSelfRatingDomain = {
  id: string;
  label: string;
};

export type QuizDefinition = {
  slug: string;
  formationSlug: string;
  title: string;
  selfRatingDomains: QuizSelfRatingDomain[];
  questions: QuizQuestion[];
};

export type QuizAttemptInput = {
  bulletinInscriptionId: string;
  quizSlug: string;
  learnerFullName: string;
  learnerEmail: string;
  companyName?: string;
  answers: Record<string, string>;
};

export type QuizAttemptDetail = {
  questionId: string;
  domain: string;
  question: string;
  submittedLabel: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
};

export type QuizAttempt = QuizAttemptInput & {
  id: string;
  scoreOn20: number;
  createdAt: string;
  /** Détail correct/incorrect par question, recalculé côté serveur. `null` si le quiz n'existe plus. */
  details?: QuizAttemptDetail[] | null;
  correctCount?: number | null;
  totalQuestions?: number | null;
};

export type BulletinInscriptionWithAttempts = BulletinInscription & {
  quizAttempts: QuizAttempt[];
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

export type ParticipantStatus = "Pré-inscrit seulement" | "Bulletin complété" | "Bulletin direct";

export type ParticipantQuizSummary = {
  id: string;
  scoreOn20: number;
  createdAt: string;
};

export type Participant = {
  id: string;
  fullName: string;
  email: string;
  company: string;
  phone: string;
  formationSlug: string;
  sessionId: string | null;
  firstContactAt: string;
  status: ParticipantStatus;
  registrationId: string | null;
  bulletinInscriptionId: string | null;
  quizAttempt: ParticipantQuizSummary | null;
};

export type CatalogData = {
  formations: Formation[];
  sessions: Session[];
  articles?: Article[];
};
