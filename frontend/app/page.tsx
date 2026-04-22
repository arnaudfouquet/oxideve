import Link from "next/link";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { ContactForm } from "@/components/ContactForm";
import { getFormations, getSessions, siteDescription } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const formations = await getFormations();
  const sessions = (await getSessions()).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="container hero-shell">
          <div className="hero-copy">
            <span className="eyebrow">Organisme terrain pour les métiers techniques</span>
            <h1>Des formations concrètes, planifiées, et prêtes à être réservées.</h1>
            <p className="lead">{siteDescription} Consultez les prochaines sessions, découvrez l'équipe Oxideve et inscrivez vos collaborateurs depuis une seule plateforme.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/inscriptions">
                Inscrire une équipe
              </Link>
              <Link className="button button-secondary" href="/qui-sommes-nous">
                Découvrir Oxideve
              </Link>
            </div>
            <div className="stats-strip">
              <span className="stat-pill">4 expertises certifiantes</span>
              <span className="stat-pill">Calendrier de sessions réel</span>
              <span className="stat-pill">Inscriptions centralisées</span>
            </div>
          </div>
          <aside className="hero-panel">
            <h2>Pourquoi les équipes reviennent</h2>
            <ul>
              <li>Planning lisible par formation, par ville et par mode de présence.</li>
              <li>Contenus rédigés pour expliquer le terrain, pas pour remplir une plaquette.</li>
              <li>Back-office prêt pour ajuster le catalogue, les textes et le pilotage commercial.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Nos formations</span>
              <h2>Un catalogue clair, orienté résultats et conformité</h2>
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
              <span className="eyebrow">Calendrier</span>
              <h2>Les prochaines sessions ouvertes à l'inscription</h2>
            </div>
            <Link href="/calendrier" className="button button-secondary">
              Calendrier complet
            </Link>
          </div>
          <TrainingCalendar formations={formations} sessions={sessions} compact />
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <article className="card card-highlight">
            <span className="eyebrow">Qui sommes-nous</span>
            <h2>Une équipe formation qui parle chantiers, qualification et rentabilité.</h2>
            <p>Oxideve construit ses parcours avec un angle simple: rendre les responsables techniques et les installateurs immédiatement opérationnels sur leurs prochains dossiers.</p>
            <div className="cta-row">
              <Link href="/qui-sommes-nous" className="button button-primary">
                Lire notre approche
              </Link>
            </div>
          </article>
          <article className="card">
            <span className="eyebrow">Inscription</span>
            <h2>Un point d'entrée unique pour vos inscriptions inter et intra.</h2>
            <p>Sélectionnez la formation et la session adaptées, décrivez votre contexte et laissez l'équipe confirmer les modalités de prise en charge.</p>
            <div className="cta-row">
              <Link href="/inscriptions" className="button button-primary">
                Ouvrir la page d'inscription
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">
          <div className="contact-card">
            <span className="eyebrow">Pré-inscription rapide</span>
            <h2>Un besoin urgent ou un arbitrage à faire cette semaine ?</h2>
            <p>Utilisez ce formulaire pour déclencher un rappel rapide. Pour une inscription complète avec choix de formation et de session, utilisez la page dédiée.</p>
          </div>
          <div className="contact-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
