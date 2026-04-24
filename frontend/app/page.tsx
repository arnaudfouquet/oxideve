import { ButtonLink, Container, Section } from "@/components/ui";
import { HomeCalendarSection, HomeIdentitySection } from "@/components/HomeExperience";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

const heroImage = "https://oxideve.com/wp-content/uploads/2024/10/Panneau-solaire-installateur-sur-un-toit-pose-photovoltaique-oxideve-200x300.webp";
const whiteLogoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";

const homeCategories = [
  { title: "Formations photovoltaïques", href: "/formations?category=Photovolta%C3%AFque" },
  { title: "Formations pompe à chaleur", href: "/formations?category=Pompes%20%C3%A0%20chaleur" },
  { title: "Formations bornes de recharge", href: "/formations?category=Bornes%20de%20recharge" },
  { title: "Formations sécurité au travail", href: "/formations?category=S%C3%A9curit%C3%A9%20au%20travail" },
  { title: "Formations Excel", href: "/formations?category=Bureautique" },
  { title: "Logo", href: "/formations", accent: true, logo: true },
];

const advantages = [
  { title: "Diversité de formation", icon: "✣" },
  { title: "Formations courtes et intenses", icon: "▷" },
  { title: "Plateaux techniques", icon: "✦" },
  { title: "Suivi de l'évolution du marché", icon: "↗" },
  { title: "Formateurs expérimentés", icon: "◎" },
  { title: "Organisme Qualiopi", icon: "★" },
  { title: "Elargir votre réseau", icon: "⌘" },
  { title: "Equipement de pointe et innovant", icon: "▣" },
  { title: "Accompagnement post formation", icon: "⚑" },
];

const keyStats = [
  { value: "843", label: "personnes formées", detail: "1er trimestre 2025" },
  { value: "166", label: "journées de formation", detail: "1er trimestre 2025" },
  { value: "3,78/4", label: "taux de satisfaction client", detail: "1er trimestre 2025" },
  { value: "14", label: "années d'expérience", detail: "au service du terrain" },
];

export default async function HomePage() {
  const formations = await getFormations();
  const sessions = await getSessions();

  return (
    <>
      <section className="landing-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.72), rgba(0, 77, 109, 0.72)), url(${heroImage})` }}>
        <Container className="landing-hero-inner">
          <h1>Centre de formation professionnelle</h1>
          <ButtonLink href="/formations" variant="primary">Nos formations</ButtonLink>
        </Container>
      </section>

      <Section className="landing-section landing-categories">
        <Container>
          <div className="landing-heading center">
            <h2>Votre centre de formation professionnelle <span className="title-accent">avec Oxideve</span></h2>
          </div>
          <div className="landing-category-grid">
            {homeCategories.map((item) => (
              <article className={`landing-category-card${item.accent ? " is-accent" : ""}`} key={item.title}>
                {item.logo ? (
                  <>
                    <img alt="Oxideve" className="landing-category-logo" src={whiteLogoUrl} />
                    <ButtonLink className="ui-button-card" href={item.href} variant="secondary">Découvrir</ButtonLink>
                  </>
                ) : (
                  <>
                    <h3>{item.title}</h3>
                    <ButtonLink className="ui-button-card" href={item.href} variant="secondary">Découvrir</ButtonLink>
                  </>
                )}
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="landing-section">
        <Container>
          <HomeIdentitySection />

          <div className="landing-heading center stats-heading">
            <h2>Nos chiffres clés 2025</h2>
          </div>
          <div className="landing-stats home-key-stats">
            {keyStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}<br />{item.detail}</span>
              </article>
            ))}
          </div>

          <div className="landing-center-cta">
            <ButtonLink className="ui-button-card" href="/inscriptions" variant="secondary">Vous aussi, formez-vous avec Oxideve</ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="landing-section landing-sessions-block">
        <Container>
          <HomeCalendarSection formations={formations} sessions={sessions} />
        </Container>
      </Section>

      <Section className="landing-section landing-benefits-shell">
        <Container>
          <div className="benefits-board">
            <h2>POURQUOI VOUS FORMER AVEC OXIDEVE ?</h2>
            <div className="benefits-grid-home">
              {advantages.map((item) => (
                <article className="benefit-pill" key={item.title}>
                  <span className="benefit-pill-icon">{item.icon}</span>
                  <strong>{item.title}</strong>
                </article>
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
              <ButtonLink className="ui-button-blue" href="/rge" variant="primary">Devenir artisan RGE</ButtonLink>
            </div>
            <div className="rge-badges">
              <span>Recharge Elec+</span>
              <span>QualiPV 2024</span>
              <span>QualiPAC 2024</span>
            </div>
          </div>

          <div className="day-type-card">
            <div className="day-type-copy">
              <h2>Votre journée type <span className="title-accent">chez Oxideve</span></h2>
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
              <ButtonLink className="ui-button-card" href="/inscriptions" variant="secondary">Je me projette</ButtonLink>
            </div>
          </div>

          <div className="quiz-band">
            <div className="quiz-band-copy">
              <h2>Quizz rapide pour orienter votre parcours de formation</h2>
              <p>Avant de vous lancer dans l&apos;une de nos formations professionnelles, pourquoi ne pas découvrir votre niveau actuel avec notre quizz d&apos;auto-évaluation ?</p>
            </div>
            <div className="quiz-band-side">
              <ButtonLink className="ui-button-green" href="/diagnostic-parcours" variant="primary">J&apos;évalue mes compétences</ButtonLink>
              <div className="quiz-band-note">
                <p>Cet outil vous permet d&apos;identifier vos points forts et les domaines où une formation peut vous aider à progresser.</p>
                <span className="home-info-badge">i</span>
              </div>
            </div>
          </div>

          <div className="funding-card funding-card-last">
            <div>
              <h2>Aide financière formation</h2>
              <p>Notre centre de formation professionnelle certifié Qualiopi vous permet d&apos;accéder à des organismes de financement formation comme le CPF, les OPCO et d&apos;autres dispositifs.</p>
              <p>Notre objectif est de rendre nos formations en énergies renouvelables accessibles à tous et de soutenir votre montée en compétences face aux attentes du marché.</p>
            </div>
            <ButtonLink className="ui-button-card" href="/actualites" variant="secondary">Découvrir</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
