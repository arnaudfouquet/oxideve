import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { formatDateRange, getFormationBySlug, getFormations, getSessionsForFormation, getSiteUrl } from "@/lib/content";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getFormations().map((formation) => ({ slug: formation.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formation = getFormationBySlug(slug);

  if (!formation) {
    return {
      title: "Formation introuvable",
    };
  }

  return {
    title: formation.seoTitle,
    description: formation.seoDescription,
    alternates: {
      canonical: `/formations/${formation.slug}`,
    },
  };
}

export default async function FormationDetailPage({ params }: Props) {
  const { slug } = await params;
  const formation = getFormationBySlug(slug);

  if (!formation) {
    notFound();
  }

  const sessions = getSessionsForFormation(slug);
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
    <section className="section">
      <div className="container">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="page-title">
          <span className="eyebrow">{formation.category}</span>
          <h1>{formation.title}</h1>
          <p>{formation.seoDescription}</p>
        </div>

        <div className="detail-layout">
          <article className="card">
            <div className="meta-row">
              <span className="meta-pill">{formation.duration}</span>
              <span className="meta-pill">{formation.location}</span>
              <span className="meta-pill">{formation.price}</span>
            </div>
            <p>{formation.description}</p>
            <h2>Objectifs</h2>
            <ul className="detail-list">
              {formation.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
            <h2>Bénéfices</h2>
            <ul className="detail-list">
              {formation.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </article>

          <aside className="card">
            <h2>Sessions disponibles</h2>
            <div className="form-grid">
              {sessions.map((session) => (
                <article key={session.id} className="card card-highlight">
                  <div className="meta-row">
                    <span className="meta-pill">{session.city}</span>
                    <span className="meta-pill">{session.mode}</span>
                  </div>
                  <p>{formatDateRange(session.startDate, session.endDate)}</p>
                  <p>{session.seatsLeft} places restantes</p>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <div className="section contact-layout">
          <div className="contact-card">
            <h2>Inscription ou qualification commerciale</h2>
            <p>Cette page SEO est conçue pour la conversion directe: prise de contact, besoin entreprise, sélection implicite de la formation et rattachement à une session.</p>
          </div>
          <div className="contact-card">
            <ContactForm defaultFormationSlug={formation.slug} defaultSessionId={sessions[0]?.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
