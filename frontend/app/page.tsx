import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { formatDateRange, getFormations, getSessions, siteDescription } from "@/lib/content";

export const revalidate = 3600;

export default function HomePage() {
  const formations = getFormations();
  const sessions = getSessions().slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="container hero-shell">
          <div className="hero-copy">
            <span className="eyebrow">Acquisition SEO et conversion terrain</span>
            <h1>Formations techniques qui font monter votre activité.</h1>
            <p className="lead">{siteDescription} Pages SEO par formation, sessions visibles, prise de contact rapide et base prête pour le pilotage commercial.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/formations">
                Voir les formations
              </Link>
              <Link className="button button-secondary" href="/calendrier">
                Consulter les sessions
              </Link>
            </div>
            <div className="stats-strip">
              <span className="stat-pill">4 expertises certifiantes</span>
              <span className="stat-pill">Sessions visibles en temps réel</span>
              <span className="stat-pill">API prête pour CRM / ERP</span>
            </div>
          </div>
          <aside className="hero-panel">
            <h2>Ce que la plateforme apporte</h2>
            <ul>
              <li>Pages SSR/ISR optimisées pour Google et les requêtes métier.</li>
              <li>Formulaire d'inscription exploitable immédiatement par l'équipe commerciale.</li>
              <li>Base Prisma PostgreSQL prête pour industrialiser le back-office.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Catalogue</span>
              <h2>Des formations construites pour convertir</h2>
            </div>
            <Link href="/formations" className="button button-secondary">
              Tout le catalogue
            </Link>
          </div>
          <div className="grid-3">
            {formations.map((formation) => (
              <article key={formation.slug} className="card card-highlight">
                <div className="meta-row">
                  <span className="meta-pill">{formation.category}</span>
                  <span className="meta-pill">{formation.duration}</span>
                </div>
                <h3>{formation.title}</h3>
                <p>{formation.summary}</p>
                <div className="chips">
                  {formation.benefits.slice(0, 2).map((benefit) => (
                    <span className="chip" key={benefit}>
                      {benefit}
                    </span>
                  ))}
                </div>
                <div className="cta-row">
                  <Link href={`/formations/${formation.slug}`} className="button button-primary">
                    Voir le détail
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Sessions</span>
              <h2>Le prochain planning commercialisable</h2>
            </div>
          </div>
          <div className="calendar-grid">
            {sessions.map((session) => {
              const formation = formations.find((item) => item.slug === session.formationSlug);

              return (
                <article key={session.id} className="card">
                  <div className="meta-row">
                    <span className="meta-pill">{session.mode}</span>
                    <span className="meta-pill">{session.city}</span>
                  </div>
                  <h3>{formation?.title}</h3>
                  <p>{formatDateRange(session.startDate, session.endDate)}</p>
                  <p>{session.seatsLeft} places restantes</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">
          <div className="contact-card">
            <span className="eyebrow">Conversion</span>
            <h2>Un besoin de formation ou une montée en charge rapide ?</h2>
            <p>Décrivez le contexte, les profils à former et vos délais. L'équipe peut transformer cette demande en session planifiée, intra ou inter-entreprises.</p>
          </div>
          <div className="contact-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
