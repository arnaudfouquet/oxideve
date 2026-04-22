import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
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
          <p>{formation.summary}</p>
        </div>

        <div className="detail-layout">
          <article className="card formation-overview">
            <div className="meta-row">
              <span className="meta-pill">{formation.duration}</span>
              <span className="meta-pill">{formation.location}</span>
              <span className="meta-pill">{formation.price}</span>
            </div>
            <p>{formation.description}</p>
            <h2>Finalité</h2>
            <p>{formation.certification}</p>
            <h2>Objectifs</h2>
            <ul className="detail-list">
              {formation.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
            <h2>Points clés</h2>
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

        <div className="section-grid-3 formation-facts">
          <article className="card">
            <h2>Prérequis</h2>
            <ul className="detail-list">
              {formation.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h2>Modalités</h2>
            <ul className="detail-list">
              {formation.modalities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="card card-highlight">
            <h2>Informations pratiques</h2>
            <p><strong>Durée :</strong> {formation.durationDetails}</p>
            <p><strong>Tarif :</strong> {formation.priceDetails}</p>
            <p><strong>Taux de réussite :</strong> {formation.successRate}</p>
          </article>
        </div>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Programme</span>
              <h2>Déroulé de la formation</h2>
            </div>
          </div>
          <div className="programme-list">
            {formation.programme.map((item, index) => (
              <article className="card card-highlight" key={item}>
                <span className="programme-step">0{index + 1}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid-2">
          <article className="card">
            <h2>Accessibilité</h2>
            <p>{formation.handicapPolicy}</p>
          </article>
          <article className="card card-highlight">
            <h2>Organisation des inscriptions</h2>
            <p>Choisissez une session ouverte, indiquez votre contexte et nous revenons vers vous pour confirmer les modalités, les prérequis et la logistique.</p>
          </article>
        </section>

        <div className="section contact-layout">
          <div className="contact-card">
            <h2>Inscription et renseignements</h2>
            <p>Le formulaire ci-contre permet de rattacher directement votre demande à cette formation et à la prochaine session disponible.</p>
          </div>
          <div className="contact-card">
            <ContactForm defaultFormationSlug={formation.slug} defaultSessionId={sessions[0]?.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
