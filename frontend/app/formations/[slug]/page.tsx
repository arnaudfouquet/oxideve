import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormationCard } from "@/components/FormationCard";
import { FormationSessionBooking } from "@/components/FormationSessionBooking";
import { Badge, ButtonLink, Container, Section, Text, Title } from "@/components/ui";
import { getFormationBySlug, getFormations, getSessionsForFormation, getSiteUrl } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);

  if (!formation) {
    return {
      title: "Formation introuvable",
    };
  }

  return {
    title: `${formation.title} | Oxideve`,
    description: formation.summary,
    alternates: {
      canonical: `/formations/${formation.slug}`,
    },
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
  const similarFormations = allFormations
    .filter((item) => item.slug !== slug && item.category === formation.category && !relatedSlugSet.has(item.slug))
    .slice(0, 3);
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: formation.title,
    description: formation.description,
    provider: {
      "@type": "Organization",
      name: "Oxideve",
      url: siteUrl,
    },
    hasCourseInstance: sessions.map((session) => ({
      "@type": "Event",
      name: `${formation.title} - session ${session.city}`,
      startDate: session.startDate,
      endDate: session.endDate,
      eventAttendanceMode:
        session.mode === "Hybride"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: session.city,
      },
    })),
  };

  const relatedFormations = (formation.relatedSlugs || [])
    .map((link) => ({ link, formation: allFormations.find((item) => item.slug === link.slug) }))
    .filter((entry) => entry.formation);

  const sessionCities = Array.from(new Set(sessions.map((session) => session.city)));
  const displayLocation =
    sessionCities.length > 0 ? sessionCities.join(", ") : formation.location;

  return (
    <>
      <Section className="formation-hero-section">
        <Container>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <div className="formation-hero-full">
            <Badge tone="accent">{formation.category}</Badge>
            <Title as="h1" title={formation.title} description={formation.summary} />
            <div className="formation-hero-actions">
              <ButtonLink href="#inscription" variant="primary">Je m'inscris</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Parler a l'equipe</ButtonLink>
            </div>

            <div className="info-bar">
              <div><span>Durée</span><strong>{formation.duration}</strong></div>
              <div><span>Lieu</span><strong>{displayLocation}</strong></div>
              <div><span>Tarif</span><strong>{formation.price}</strong></div>
              <div><span>Public</span><strong>{formation.audience}</strong></div>
            </div>
          </div>

          {formation.rgeBadge ? (
            <div className="formation-rge-strip">
              <div>
                <p className="formation-subhead">{formation.certification}</p>
                <Text size="lg">{formation.description}</Text>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={formation.rgeBadge.label} className="formation-rge-badge" src={formation.rgeBadge.imageUrl} />
            </div>
          ) : null}

          <div className="detail-layout-modern">
            <article className="detail-main-card">
              <Title eyebrow="Description" title="A qui s'adresse cette formation" />
              <Text size="lg">{formation.audience}</Text>
              <Text>{formation.description}</Text>

              <div className="formation-objectives-list">
                <p className="formation-subhead">Ce que la formation vous apporte</p>
                <ol>
                  {formation.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ol>
              </div>

              <div className="detail-block-grid">
                <div>
                  <p className="formation-subhead">Points forts</p>
                  <ul className="detail-list">
                    {formation.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="formation-subhead">Prérequis</p>
                  <ul className="detail-list">
                    {formation.prerequisites.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </article>

            <aside className="detail-sidebar-stack">
              <div className="detail-side-card detail-side-card-accent">
                <p className="formation-subhead">Informations pratiques</p>
                <dl className="formation-fact-list">
                  <div>
                    <dt>Durée détaillée</dt>
                    <dd>{formation.durationDetails}</dd>
                  </div>
                  <div>
                    <dt>Tarif</dt>
                    <dd>
                      <strong className="formation-fact-price">{formation.price}</strong>
                      {" "}
                      {formation.priceDetails}
                    </dd>
                  </div>
                  <div>
                    <dt>Réussite</dt>
                    <dd>{formation.successRate}</dd>
                  </div>
                  <div>
                    <dt>Accessibilité</dt>
                    <dd>{formation.handicapPolicy}</dd>
                  </div>
                  <div>
                    <dt>Finalité</dt>
                    <dd>{formation.certification}</dd>
                  </div>
                </dl>
                <div className="formation-fact-list-block">
                  <p className="formation-subhead">Modalités pédagogiques</p>
                  <ul className="detail-list">
                    {formation.modalities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title eyebrow="Programme" title="Le déroulé de la formation" description="Projetez-vous avec le détail jour par jour du programme." />
          <div className="formation-programme-days">
            {formation.programme.map((day, dayIndex) => (
              <article className="formation-programme-day" key={day.title}>
                <p className="formation-programme-day-title">Jour {dayIndex + 1} : {day.title}</p>
                {day.sequences.map((sequence) => (
                  <div className="formation-programme-sequence" key={sequence.title}>
                    <p className="formation-programme-sequence-title">{sequence.title}</p>
                    <ul className="detail-list">
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
      </Section>

      <Section id="inscription">
        <Container>
          <FormationSessionBooking formation={formation} sessions={sessions} />
        </Container>
      </Section>

      {formation.faq?.length ? (
        <Section>
          <Container>
            <Title eyebrow="FAQ" title="Questions fréquentes" className="formation-faq-title" />
            <div className="formation-faq-list">
              {formation.faq.map((entry) => (
                <details className="formation-detail-accordion formation-faq-item" key={entry.question}>
                  <summary>{entry.question}</summary>
                  <Text>{entry.answer}</Text>
                </details>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {relatedFormations.length ? (
        <Section>
          <Container>
            <Title eyebrow="Pour aller plus loin" title="Nos formations complémentaires" />
            <div className="training-showcase-grid">
              {relatedFormations.map(({ formation: related }) =>
                related ? <FormationCard formation={related} key={related.slug} /> : null,
              )}
            </div>
          </Container>
        </Section>
      ) : null}

      {similarFormations.length ? (
        <Section>
          <Container>
            <Title eyebrow="Formations similaires" title={`Autres formations ${formation.category.toLowerCase()}`} />
            <div className="training-showcase-grid">
              {similarFormations.map((item) => (
                <FormationCard formation={item} key={item.slug} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
