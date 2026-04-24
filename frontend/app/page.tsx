import { ButtonLink, Container, Section } from "@/components/ui";
import { HomeCalendarSection, HomeIdentitySection } from "@/components/HomeExperience";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

const heroImage = encodeURI("/assets/accueil/formation oxideve hero.webp");
const whiteLogoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";
const infoIconUrl = "/assets/info-icon.svg";
const trustIconUrl = encodeURI("/assets/accueil/icone google avis oxideve.svg");
const rgeHighlightImage = encodeURI("/assets/accueil/formation qualipv qualipac recharge elec oxideve.svg");
const dayTypeImage = encodeURI("/assets/accueil/journée type formation oxideve.svg");

function categoryAnchor(category: string) {
  return `/formations#category-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

const homeCategories = [
  { title: ["Formation", "photovoltaïque"], href: categoryAnchor("Photovoltaïque") },
  { title: ["Formation", "pompe à chaleur"], href: categoryAnchor("Pompes à chaleur") },
  { title: ["Formation", "bornes de recharge"], href: categoryAnchor("Bornes de recharge") },
  { title: ["Formation", "sécurité au travail"], href: categoryAnchor("Sécurité au travail") },
  { title: ["Formation", "Excel"], href: categoryAnchor("Bureautique") },
  { title: "Logo", href: "/formations", accent: true, logo: true },
];

const advantages = [
  { title: "Diversité de formation", icon: encodeURI("/assets/accueil/diversite formation oxideve.svg") },
  { title: "Formations courtes et intenses", icon: encodeURI("/assets/accueil/formation courte intense oxideve.svg") },
  { title: "Plateaux techniques", icon: encodeURI("/assets/accueil/plateaux techniques oxideve.svg") },
  { title: "Suivi de l'évolution du marché", icon: encodeURI("/assets/accueil/formation evolution marche oxideve.svg") },
  { title: "Formateurs expérimentés", icon: encodeURI("/assets/accueil/formateurs experimentés oxideve.svg") },
  { title: "Organisme Qualiopi", icon: encodeURI("/assets/accueil/qualipio oxideve formation.svg") },
  { title: "Elargir votre réseau", icon: encodeURI("/assets/accueil/reseau oxideve formation.svg") },
  { title: "Equipement de pointe et innovant", icon: encodeURI("/assets/accueil/equipement formation.svg") },
  { title: "Accompagnement post formation", icon: encodeURI("/assets/accueil/accompagenement formation qualipv.svg") },
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
          <h1>
            Votre centre de formation
            <br />
            professionnelle
            <br />
            <span className="title-accent">avec Oxideve</span>
          </h1>
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
              <article className={`landing-category-card${item.accent ? " is-accent" : ""}`} key={item.href}>
                {item.logo ? (
                  <>
                    <img alt="Oxideve" className="landing-category-logo" src={whiteLogoUrl} />
                    <ButtonLink className="ui-button-card" href={item.href} variant="secondary">Découvrir</ButtonLink>
                  </>
                ) : (
                  <>
                    <h3>
                      {item.title[0]}
                      <br />
                      {item.title[1]}
                    </h3>
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
                  <span className="benefit-pill-icon"><img alt="" src={item.icon} /></span>
                  <strong>{item.title}</strong>
                </article>
              ))}
            </div>
          </div>

          <div className="trust-strip">
            <div className="trust-strip-copy">
              <h3>Ils nous font confiance</h3>
              <p>Des professionnels du terrain choisissent Oxideve pour des formations concrètes, rapides et directement applicables.</p>
            </div>
            <div className="trust-strip-card">
              <img alt="Avis Google Oxideve" src={trustIconUrl} />
              <strong>4,7/5 sur les avis stagiaires</strong>
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
              <div className="rge-highlight-media">
                <img alt="Formations QualiPV, QualiPAC et Recharge Elec+" src={rgeHighlightImage} />
              </div>
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
              <img alt="Journée type de formation Oxideve" src={dayTypeImage} />
              <ButtonLink className="ui-button-card" href="/inscriptions" variant="secondary">Je me projette</ButtonLink>
            </div>
          </div>

          <div className="quiz-band">
            <div className="quiz-band-copy">
              <h2>Quizz rapide pour orienter votre parcours de formation</h2>
              <p>Avant de vous lancer dans l&apos;une de nos formations professionnelles, pourquoi ne pas découvrir votre niveau actuel avec notre <strong>quizz d&apos;auto-évaluation</strong> ?</p>
            </div>
            <div className="quiz-band-side">
              <ButtonLink className="ui-button-green" href="/diagnostic-parcours" variant="primary">J&apos;évalue mes compétences</ButtonLink>
              <div className="quiz-band-note">
                <p>Cet outil vous permet d&apos;identifier vos points forts et les domaines où une formation peut vous aider à progresser.</p>
                <span className="home-info-badge"><img alt="" src={infoIconUrl} /></span>
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
