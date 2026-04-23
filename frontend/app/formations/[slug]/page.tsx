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
  const similarFormations = allFormations.filter((item) => item.slug !== slug && item.category === formation.category).slice(0, 3);
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

  return (
    <>
      <Section>
        <Container>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <div className="formation-hero">
            <div>
              <Badge tone="soft">{formation.category}</Badge>
              <Title as="h1" title={formation.title} description={formation.summary} />
              <div className="formation-hero-actions">
                <ButtonLink href="/inscriptions" variant="primary">Je m'inscris</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">Parler a l'equipe</ButtonLink>
              </div>
            </div>
            <aside className="sticky-cta-card">
              <strong>Prochaine session</strong>
              <p>{sessions[0] ? formatDateRange(sessions[0].startDate, sessions[0].endDate) : "Calendrier en preparation"}</p>
              <span>{sessions[0]?.city || formation.location}</span>
              <ButtonLink href="/inscriptions" variant="primary">Reserver une place</ButtonLink>
            </aside>
          </div>

          <div className="info-bar">
            <div><span>Duree</span><strong>{formation.duration}</strong></div>
            <div><span>Lieu</span><strong>{formation.location}</strong></div>
            <div><span>Tarif</span><strong>{formation.price}</strong></div>
            <div><span>Public</span><strong>{formation.audience}</strong></div>
          </div>

          <div className="detail-layout-modern">
            <article className="detail-main-card">
              <Title eyebrow="Description" title="Ce que couvre le parcours" />
              <Text size="lg">{formation.description}</Text>
              <div className="detail-block-grid">
                <div>
                  <h2>Objectifs pedagogiques</h2>
                  <ul className="detail-list">
                    {formation.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2>Points forts</h2>
                  <ul className="detail-list">
                    {formation.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <aside className="detail-sidebar-stack">
              <div className="detail-side-card">
                <h2>Prérequis</h2>
                <ul className="detail-list">
                  {formation.prerequisites.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-side-card">
                <h2>Modalites</h2>
                <ul className="detail-list">
                  {formation.modalities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-side-card detail-side-card-accent">
                <h2>Informations pratiques</h2>
                <p><strong>Duree detaillee :</strong> {formation.durationDetails}</p>
                <p><strong>Tarif :</strong> {formation.priceDetails}</p>
                <p><strong>Reussite :</strong> {formation.successRate}</p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section surface="muted">
        <Container>
          <Title eyebrow="Programme" title="Deroule jour par jour" />
          <div className="programme-list programme-list-modern">
            {formation.programme.map((item, index) => (
              <article className="programme-card" key={item}>
                <span className="programme-step">{String(index + 1).padStart(2, "0")}</span>
                <h3>Jour {index + 1}</h3>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
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
            <div className="detail-side-card">
              <h2>Accessibilite</h2>
              <p>{formation.handicapPolicy}</p>
              <h2>Finalite</h2>
              <p>{formation.certification}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="contrast">
        <Container className="detail-cta-band">
          <div>
            <Title eyebrow="Inscription" title={`Préparer votre inscription à ${formation.shortTitle}`} description="Le formulaire ci-contre permet de rattacher directement votre demande à cette formation et à la prochaine session visible." />
          </div>
          <div className="contact-card contact-card-form">
            <ContactForm defaultFormationSlug={formation.slug} defaultSessionId={sessions[0]?.id} />
          </div>
        </Container>
      </Section>

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
    </>
  );
}
