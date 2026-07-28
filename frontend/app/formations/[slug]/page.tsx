import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { FormationCard } from "@/components/FormationCard";
import { SessionCard } from "@/components/SessionCard";
import { Badge, ButtonLink, Container, Section, Text, Title } from "@/components/ui";
import { formatDateRange, getFormationBySlug, getFormations, getSessionsForFormation, getSiteUrl } from "@/lib/content";

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

  return (
    <>
      <Section>
        <Container>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <div className="formation-hero">
            <div className="formation-hero-main">
              <Badge tone="accent">{formation.category}</Badge>
              <Title as="h1" title={formation.title} description={formation.summary} />
              <div className="formation-hero-actions">
                <ButtonLink href="#inscription" variant="primary">Je m'inscris</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">Parler a l'equipe</ButtonLink>
              </div>
            </div>
            <aside className="sticky-cta-card">
              <strong>Prochaine session</strong>
              <p>{sessions[0] ? formatDateRange(sessions[0].startDate, sessions[0].endDate) : "Calendrier en preparation"}</p>
              <span>{sessions[0]?.city || formation.location}</span>
              <ButtonLink href="#inscription" variant="primary">Choisir cette session</ButtonLink>
            </aside>
          </div>

          <div className="info-bar">
            <div><span>Duree</span><strong>{formation.duration}</strong></div>
            <div><span>Lieu</span><strong>{formation.location}</strong></div>
            <div><span>Tarif</span><strong>{formation.price}</strong></div>
            <div><span>Public</span><strong>{formation.audience}</strong></div>
          </div>

          {formation.rgeBadge ? (
            <div className="formation-rge-strip">
              <div>
                <h2>{formation.certification}</h2>
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
                <h2>Ce que la formation vous apporte</h2>
                <ol>
                  {formation.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ol>
              </div>

              <div className="detail-block-grid">
                <div>
                  <h2>Points forts</h2>
                  <ul className="detail-list">
                    {formation.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2>Prérequis</h2>
                  <ul className="detail-list">
                    {formation.prerequisites.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <details className="formation-detail-accordion">
                <summary>Modalités pédagogiques</summary>
                <ul className="detail-list">
                  {formation.modalities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            </article>

            <aside className="detail-sidebar-stack">
              <div className="detail-side-card detail-side-card-accent">
                <h2>Informations pratiques</h2>
                <p><strong>Duree detaillee :</strong> {formation.durationDetails}</p>
                <p><strong>Tarif :</strong> {formation.priceDetails}</p>
                <p><strong>Reussite :</strong> {formation.successRate}</p>
                <p><strong>Accessibilité :</strong> {formation.handicapPolicy}</p>
                <p><strong>Finalité :</strong> {formation.certification}</p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section surface="muted">
        <Container>
          <Title eyebrow="Programme" title="Le déroulé de la formation" description="Projetez-vous avec le détail jour par jour du programme." />
          <div className="formation-programme-days">
            {formation.programme.map((day, dayIndex) => (
              <article className="formation-programme-day" key={day.title}>
                <h3>Jour {dayIndex + 1} : {day.title}</h3>
                {day.sequences.map((sequence) => (
                  <div className="formation-programme-sequence" key={sequence.title}>
                    <h4>{sequence.title}</h4>
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
          <div className="formation-pricing-grid">
            <div className="formation-pricing-card">
              <span>Tarif standard</span>
              <strong>{formation.price}</strong>
            </div>
            {formation.priceMember ? (
              <div className="formation-pricing-card formation-pricing-card-accent">
                <span>{formation.priceMemberLabel || "Tarif adhérent"}</span>
                <strong>{formation.priceMember}</strong>
              </div>
            ) : null}
          </div>

          {formation.memberProgram ? (
            <div className="detail-side-card formation-member-program">
              <h2>{formation.memberProgram.name}</h2>
              <p>{formation.memberProgram.description}</p>
            </div>
          ) : null}
        </Container>
      </Section>

      <Section surface="muted">
        <Container>
          <div className="session-detail-grid">
            <div>
              <Title eyebrow="Sessions" title="Sessions disponibles" />
              <div className="session-grid">
                {sessions.map((session) => (
                  <SessionCard key={session.id} formation={formation} session={session} />
                ))}
              </div>
            </div>
            <div className="contact-card contact-card-form">
              <Title eyebrow="Inscription" title={`Préparer votre inscription à ${formation.shortTitle}`} />
              <ContactForm defaultFormationSlug={formation.slug} defaultSessionId={sessions[0]?.id} />
            </div>
          </div>
        </Container>
      </Section>

      {relatedFormations.length ? (
        <Section>
          <Container>
            <Title eyebrow="Pour aller plus loin" title="Nos formations complémentaires" />
            <div className="formation-related-grid">
              {relatedFormations.map(({ link, formation: related }) => (
                <ButtonLink className="formation-related-card" href={`/formations/${link.slug}`} key={link.slug} variant="secondary">
                  {link.label || related?.shortTitle}
                </ButtonLink>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {formation.faq?.length ? (
        <Section surface="muted">
          <Container>
            <Title eyebrow="FAQ" title="Questions fréquentes" />
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
