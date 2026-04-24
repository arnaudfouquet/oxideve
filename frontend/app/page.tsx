import { ButtonLink, Container, Section } from "@/components/ui";
import { HomeExperience } from "@/components/HomeExperience";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

const heroImage = "https://oxideve.com/wp-content/uploads/2024/10/Panneau-solaire-installateur-sur-un-toit-pose-photovoltaique-oxideve-200x300.webp";

const homeCategories = [
  { title: "Formations photovoltaïques", href: "/formations?category=Photovolta%C3%AFque" },
  { title: "Formations pompe à chaleur", href: "/formations?category=Pompes%20%C3%A0%20chaleur" },
  { title: "Formations bornes de recharge", href: "/formations?category=Bornes%20de%20recharge" },
  { title: "Formations sécurité au travail", href: "/formations?category=S%C3%A9curit%C3%A9%20au%20travail" },
  { title: "Formations Excel", href: "/formations?category=Bureautique" },
  { title: "Découvrir toutes nos formations", href: "/formations", accent: true },
];

const advantages = [
  "Diversité de formation",
  "Formations courtes et intenses",
  "Plateaux techniques",
  "Suivi de l'évolution du marché",
  "Formateurs expérimentés",
  "Organisme qualiopi",
  "Elargir votre réseau",
  "Equipement de pointe et innovant",
  "Accompagnement post formation",
];

export default async function HomePage() {
  const formations = await getFormations();
  const sessions = await getSessions();
  const qualiopiCertificateUrl = "https://oxideve.com/wp-content/uploads/2024/10/certificat-QUA006534_0EFZRQB1N5WGT-2023-2026.pdf";

  return (
    <>
      <section className="landing-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.72), rgba(0, 77, 109, 0.72)), url(${heroImage})` }}>
        <Container className="landing-hero-inner">
          <span className="landing-hero-kicker">Formation bâtiment</span>
          <div className="landing-hero-play" aria-hidden="true">▶</div>
          <h1>Centre de formation professionnelle</h1>
          <ButtonLink href="/formations" variant="primary">Nos formations</ButtonLink>
        </Container>
      </section>

      <Section className="landing-section landing-categories">
        <Container>
          <div className="landing-heading center">
            <span className="section-kicker">Formation bâtiment</span>
            <h2>Votre centre de formation professionnelle avec Oxideve</h2>
          </div>
          <div className="landing-category-grid">
            {homeCategories.map((item) => (
              <article className={`landing-category-card${item.accent ? " is-accent" : ""}`} key={item.title}>
                <h3>{item.title}</h3>
                <ButtonLink href={item.href} variant="primary">Découvrir</ButtonLink>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="landing-section">
        <Container>
          <div className="funding-card">
            <div>
              <h2>Aide financière formation</h2>
              <p>Notre centre de formation professionnelle certifié Qualiopi vous permet d'accéder à des organismes de financement formation comme le CPF, les OPCO et d'autres dispositifs.</p>
              <p>Notre objectif est de rendre nos formations en énergies renouvelables accessibles à tous et de soutenir votre montée en compétences face aux attentes du marché.</p>
            </div>
            <ButtonLink href="/actualites" variant="secondary">Découvrir notre article</ButtonLink>
          </div>

          <HomeExperience formations={formations} sessions={sessions} />

          <div className="landing-center-cta">
            <a className="review-button" href={qualiopiCertificateUrl} rel="noreferrer" target="_blank">Certif Qualiopi</a>
          </div>

          <div className="landing-heading center stats-heading">
            <span className="section-kicker">Formation dans le bâtiment</span>
            <h2>Nos chiffres clés 2024</h2>
          </div>
          <div className="landing-stats">
            <article>
              <strong>843</strong>
              <span>Personnes formées<br />1er trimestre 2024</span>
            </article>
            <article>
              <strong>166</strong>
              <span>Journée de formation<br />1er trimestre 2024</span>
            </article>
            <article>
              <strong>3,78/4</strong>
              <span>Taux de satisfaction client<br />1er trimestre 2024</span>
            </article>
            <article>
              <strong>14</strong>
              <span>Années<br />d&apos;expérience</span>
            </article>
          </div>

          <div className="landing-center-cta">
            <ButtonLink href="/inscriptions" variant="secondary">Vous aussi, formez-vous avec Oxideve</ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="landing-section landing-sessions-block">
        <Container>
          <div className="landing-heading">
            <h2>Nos prochaines sessions de formation BTP</h2>
            <p>Inscrivez-vous à nos formations rapides et techniques pour les professionnels du bâtiment.</p>
          </div>
          <div className="landing-center-cta">
            <ButtonLink href="/calendrier" variant="primary">Je consulte les sessions</ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="landing-section landing-benefits-shell">
        <Container>
          <div className="benefits-board">
            <h2>POURQUOI VOUS FORMER AVEC OXIDEVE ?</h2>
            <div className="benefits-grid-home">
              {advantages.map((item) => (
                <article className="benefit-pill" key={item}>{item}</article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="landing-section">
        <Container>
          <div className="rge-highlight-card">
            <div>
              <h2>TOUT SAVOIR SUR LES CERTIFICATIONS RGE</h2>
              <h3>Une expertise reconnaissable grâce à votre certification</h3>
              <p>Découvrez l&apos;importance d&apos;être artisan RGE grâce à nos formations QualiPV, QualiPAC et IRVE.</p>
              <ButtonLink href="/rge" variant="primary">Devenir artisan RGE</ButtonLink>
            </div>
            <div className="rge-badges">
              <span>Recharge Elec+</span>
              <span>QualiPV</span>
              <span>QualiPAC</span>
            </div>
          </div>

          <div className="day-type-card">
            <div className="day-type-copy">
              <h2>Votre journée type chez Oxideve</h2>
              <p>Chaque programme est structuré pour combiner théorie essentielle et pratique sur nos plateaux techniques.</p>
              <p>Nos formations énergies renouvelables sont conçues pour enrichir vos compétences et vous préparer aux défis actuels du secteur du bâtiment. Que ce soit en photovoltaïque, pompes à chaleur, sécurité, bureautique ou véhicules électriques, nos parcours répondent à vos besoins.</p>
              <p>Explorez le déroulé de chaque formation et trouvez celle qui correspond le mieux à vos ambitions. Faites le premier pas vers une qualification reconnue et un apprentissage de qualité.</p>
              <ul>
                <li>Photovoltaïque</li>
                <li>Pompe à chaleur</li>
                <li>Sécurité</li>
                <li>Bureautique</li>
                <li>Véhicules électriques</li>
              </ul>
            </div>
            <div className="day-type-visual">
              <div className="day-type-wheel">
                <span>☀</span>
                <span>🔥</span>
                <span>⛑</span>
                <span>🔌</span>
                <strong>?</strong>
              </div>
              <ButtonLink href="/inscriptions" variant="secondary">Je me projette</ButtonLink>
            </div>
          </div>

          <div className="quiz-band">
            <div className="quiz-band-copy">
              <h2>Quizz rapide pour orienter votre parcours de formation</h2>
              <p>Avant de vous lancer dans l&apos;une de nos formations professionnelles, découvrez votre niveau actuel avec notre quizz d&apos;auto-évaluation.</p>
              <p>Cet outil vous permet d&apos;identifier vos points forts et les domaines où une formation peut vous aider à progresser.</p>
            </div>
            <ButtonLink href="/diagnostic-parcours" variant="primary">J&apos;évalue mes compétences</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
