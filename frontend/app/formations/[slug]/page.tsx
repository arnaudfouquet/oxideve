import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormationCatalogCard } from "@/components/FormationCatalog";
import { FormationSessionBooking } from "@/components/FormationSessionBooking";
import { ButtonLink, Container } from "@/components/ui";
import { getCategoryTheme } from "@/lib/formation-theme";
import { getFormationBySlug, getFormations, getSessionsForFormation, getSiteUrl } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);

  if (!formation) {
    return { title: "Formation introuvable" };
  }

  return {
    title: `${formation.title} | Oxideve`,
    description: formation.summary,
    alternates: { canonical: `/formations/${formation.slug}` },
  };
}

export default async function FormationDetailPage({ params }: Props) {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);

  if (!formation) {
    notFound();
  }

  const sessions = await getSessionsForFormation(slug);
  const allFormations = await getFormations();
  const relatedSlugSet = new Set((formation.relatedSlugs || []).map((link) => link.slug));
  const relatedFormations = (formation.relatedSlugs || [])
    .map((link) => allFormations.find((item) => item.slug === link.slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const similarFormations = allFormations
    .filter((item) => item.slug !== slug && item.category === formation.category && !relatedSlugSet.has(item.slug))
    .slice(0, 3);
  const suggestions = (relatedFormations.length ? relatedFormations : similarFormations).slice(0, 3);

  const theme = getCategoryTheme(formation.category);
  const sessionCities = Array.from(new Set(sessions.map((session) => session.city)));
  const displayLocation = sessionCities.length ? sessionCities.join(", ") : formation.location;

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: formation.title,
    description: formation.description,
    provider: { "@type": "Organization", name: "Oxideve", url: siteUrl },
    hasCourseInstance: sessions.map((session) => ({
      "@type": "Event",
      name: `${formation.title} - session ${session.city}`,
      startDate: session.startDate,
      endDate: session.endDate,
      eventAttendanceMode:
        session.mode === "Hybride"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: session.city },
    })),
  };

  const facts = [
    { icon: "/assets/formations/icone-heure.svg", label: "Durée", value: formation.duration },
    { icon: "/assets/formations/icone-lieu.svg", label: "Lieu", value: displayLocation },
    { icon: "/assets/formations/icone-euro.svg", label: "Tarif", value: formation.price, cpf: formation.cpfEligible },
    { icon: "/assets/formations/icone-public.svg", label: "Public", value: formation.audience },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* BANNIÈRE DE CATÉGORIE */}
      <div className="fd-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={formation.category} src={theme.banner} />
      </div>

      {/* EN-TÊTE : titre + cartes info */}
      <section className="fd-head">
        <Container>
          <div className="fd-head-layout">
            <div className="fd-head-copy">
              <span className="fd-category">{formation.category}</span>
              <h1>
                {formation.title}
                {formation.levelLabel ? <em> {formation.levelLabel}</em> : null}
              </h1>
              <p className="fd-summary">{formation.summary}</p>
              <div className="fd-head-actions">
                <ButtonLink href="#inscription" variant="primary" className="home-cta-arrow">
                  Je m&apos;inscris
                </ButtonLink>
                <ButtonLink href="/contact" variant="primary" className="home-cta-arrow">
                  Parler à l&apos;équipe
                </ButtonLink>
              </div>
            </div>

            <div className="fd-facts">
              {facts.map((fact) => (
                <div className="fd-fact" key={fact.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={fact.icon} />
                  <span className="fd-fact-label">{fact.label}</span>
                  <strong className="fd-fact-value">{fact.value}</strong>
                  {fact.cpf ? <span className="formation-tile-cpf">Finançable CPF</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="fd-local">
            <div className="fd-local-copy">
              <p className="fd-local-title">Vous souhaitez suivre cette formation près de chez vous ?</p>
              <p className="fd-local-text">Cette formation peut être organisée partout en France, selon les demandes et les possibilités.</p>
            </div>
            <svg className="fd-local-pin" viewBox="0 0 48 60" aria-hidden="true">
              <path
                d="M24 0C10.7 0 0 10.7 0 24c0 17 24 36 24 36s24-19 24-36C48 10.7 37.3 0 24 0Z"
                fill="var(--color-navy)"
              />
              <circle cx="24" cy="23" r="9" fill="#ffffff" />
            </svg>
            <ButtonLink href="/contact" variant="primary" className="fd-local-cta home-cta-arrow">
              Faire une demande
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* FINALITÉ (bande navy) */}
      {formation.certification ? (
        <section className="fd-purpose">
          <Container>
            <div className="fd-purpose-layout">
              <div>
                <h2>{formation.certification}</h2>
                <p>{formation.description}</p>
              </div>
              {formation.rgeBadge ? (
                <div className="fd-purpose-badges">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={formation.rgeBadge.label} src={formation.rgeBadge.imageUrl} />
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      ) : null}

      {/* DESCRIPTION + INFOS PRATIQUES */}
      <section className="fd-body">
        <Container>
          <div className="fd-body-layout">
            <article className="fd-card fd-card-description">
              <span className="fd-help-badge" aria-hidden="true">?</span>
              <span className="fd-pill fd-pill-blue">Description</span>
              <h2 className="fd-card-title">
                A qui s&apos;adresse <em>cette</em> <strong>formation</strong>
              </h2>

              <p className="fd-audience">{formation.audience}</p>
              <p className="fd-description">{formation.description}</p>

              <p className="fd-subhead">Ce que la formation vous apporte</p>
              <ol className="fd-objectives">
                {formation.objectives.map((objective, index) => (
                  <li key={objective}>
                    <span className="fd-objective-index">{index + 1}</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ol>

              <div className="fd-split">
                <div className="fd-split-card">
                  <h3>Points forts</h3>
                  <ul>
                    {formation.benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="fd-split-card">
                  <h3>Prérequis</h3>
                  <ul>
                    {formation.prerequisites.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <aside className="fd-aside">
              <div className="fd-card fd-practical">
                <h2>Informations pratiques</h2>
                <div className="fd-practical-item">
                  <h3>Durée détaillée</h3>
                  <p>{formation.durationDetails}</p>
                </div>
                <div className="fd-practical-item">
                  <h3>Tarif</h3>
                  <p>
                    <strong>{formation.price}</strong> {formation.priceDetails}
                  </p>
                </div>
                <div className="fd-practical-item">
                  <h3>Réussite</h3>
                  <p>{formation.successRate}</p>
                </div>
                <div className="fd-practical-item">
                  <h3>Accessibilité</h3>
                  <p>{formation.handicapPolicy}</p>
                </div>
                {formation.certification ? (
                  <div className="fd-practical-item">
                    <h3>Finalité</h3>
                    <p>{formation.certification}</p>
                  </div>
                ) : null}
              </div>

              <div className="fd-modalities">
                <h3>Modalités pédagogiques</h3>
                <ul>
                  {formation.modalities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* PROGRAMME */}
      <section className="fd-programme">
        <Container>
          <div className="fd-programme-head">
            <span className="fd-pill fd-pill-green">Programme</span>
            <h2>Le déroulé de la formation</h2>
            <p>Projetez-vous avec le détail jour par jour du programme.</p>
          </div>

          <div className="fd-programme-days">
            {formation.programme.map((day, dayIndex) => (
              <article className="fd-day" key={day.title}>
                <p className="fd-day-title">
                  <strong>Jour {dayIndex + 1} :</strong> <em>{day.title}</em>
                </p>
                {day.sequences.map((sequence) => (
                  <div className="fd-sequence" key={sequence.title}>
                    <h3>{sequence.title}</h3>
                    <ul>
                      {sequence.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* INSCRIPTION */}
      <section className="fd-signup" id="inscription">
        <Container>
          <div className="fd-card fd-signup-card">
            <span className="fd-pill fd-pill-blue">Inscription</span>
            <h2>Préparer votre inscription à {formation.shortTitle}</h2>
            <FormationSessionBooking formation={formation} sessions={sessions} />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      {formation.faq?.length ? (
        <section className="fd-faq">
          <Container>
            <div className="home-faq-layout">
              <div className="home-faq-aside">
                <span className="fd-pill fd-pill-navy">FAQ</span>
                <h2>
                  Questions
                  <br />
                  fréquentes
                </h2>
              </div>
              <div className="home-faq-list">
                {formation.faq.map((entry) => (
                  <details className="home-faq-item" key={entry.question}>
                    <summary>
                      <span>{entry.question}</span>
                      <span className="home-faq-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </summary>
                    <p>{entry.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {/* FORMATIONS COMPLÉMENTAIRES */}
      {suggestions.length ? (
        <section className="fd-related">
          <Container>
            <span className="fd-pill fd-pill-green">Pour aller plus loin</span>
            <h2>
              Nos formations <em>complémentaires</em>
            </h2>
            <div className="catalog-grid">
              {suggestions.map((item) => (
                <FormationCatalogCard formation={item} key={item.slug} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
