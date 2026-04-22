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
            <span className="eyebrow">Formations énergie, électricité et CVC</span>
            <h1>Des parcours lisibles, un calendrier réel, et des fiches formation prêtes à être utilisées.</h1>
            <p className="lead">{siteDescription} Retrouvez des formations structurées autour des points qui comptent vraiment: prérequis, objectifs, modalités, programme, durée, tarif et accessibilité.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/formations">
                Voir les formations
              </Link>
              <Link className="button button-secondary" href="/inscriptions">
                Demander une inscription
              </Link>
            </div>
            <div className="stats-strip">
              <span className="stat-pill">4 domaines de formation</span>
              <span className="stat-pill">Sessions ouvertes visibles</span>
              <span className="stat-pill">Demandes d'inscription centralisées</span>
            </div>
          </div>
          <aside className="hero-panel">
            <h2>Ce que vous trouverez ici</h2>
            <ul>
              <li>Un catalogue rédigé pour les responsables techniques, installateurs et conducteurs de travaux.</li>
              <li>Des fiches formation qui exposent les conditions d'entrée et le programme sans détour.</li>
              <li>Un calendrier utilisable immédiatement pour projeter une inscription inter ou intra.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Nos formations</span>
              <h2>Un catalogue pensé pour comparer vite et choisir juste</h2>
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
                    Consulter la fiche
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
            <span className="eyebrow">Méthode</span>
            <h2>Une approche qui tient ensemble réglementation, geste technique et préparation chantier.</h2>
            <p>Oxideve construit ses formations pour aider les équipes à exécuter correctement, documenter les interventions et préparer les qualifications attendues.</p>
            <div className="cta-row">
              <Link href="/qui-sommes-nous" className="button button-primary">
                Découvrir l'équipe
              </Link>
            </div>
          </article>
          <article className="card">
            <span className="eyebrow">Inscription</span>
            <h2>Un point d'entrée unique pour les demandes inter, intra et les besoins de planification.</h2>
            <p>Sélectionnez la formation et la session, précisez votre besoin et laissez l'équipe valider les disponibilités, les prérequis et l'organisation.</p>
            <div className="cta-row">
              <Link href="/inscriptions" className="button button-primary">
                Aller au formulaire
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">
          <div className="contact-card">
            <span className="eyebrow">Contact rapide</span>
            <h2>Une question sur un parcours, une date ou un prérequis ?</h2>
            <p>Utilisez ce formulaire pour obtenir un retour rapide. Pour rattacher la demande à une session précise, utilisez la page d'inscription.</p>
          </div>
          <div className="contact-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
