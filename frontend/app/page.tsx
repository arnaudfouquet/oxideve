import { ButtonLink, Container, Section } from "@/components/ui";
import { formatDateRange, getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

const heroImage = "https://oxideve.com/wp-content/uploads/2024/10/Panneau-solaire-installateur-sur-un-toit-pose-photovoltaique-oxideve-200x300.webp";

const homeCategories = [
  { title: "Formations photovoltaïques", href: "/formations?category=Photovolta%C3%AFque" },
  { title: "Formations pompe à chaleur", href: "/formations?category=Pompes%20%C3%A0%20chaleur" },
  { title: "Formations bornes de recharge", href: "/formations?category=Bornes%20de%20recharge" },
  { title: "Formations sécurité au travail", href: "/formations" },
  { title: "Formations Excel", href: "/formations" },
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
  const featuredSession = sessions[0];
  const featuredFormation = formations.find((formation) => formation.slug === featuredSession?.formationSlug) ?? formations[0];
  const qualiopiCertificateUrl = "https://oxideve.com/wp-content/uploads/2024/10/certificat-QUA006534_0EFZRQB1N5WGT-2023-2026.pdf";

  return (
    <>
      <section className="landing-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.72), rgba(0, 77, 109, 0.72)), url(${heroImage})` }}>
        <Container className="landing-hero-inner">
          <div className="landing-hero-play" aria-hidden="true">▶</div>
          <h1>Centre de formation professionnelle</h1>
          <ButtonLink href="/formations" variant="primary">Nos formations</ButtonLink>
        </Container>
      </section>

      <Section className="landing-section landing-categories">
        <Container>
          <div className="landing-heading center">
            <h2>Formation aux énergies renouvelables avec Oxideve</h2>
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

          <div className="identity-panel">
            <div>
              <h2>OXIDEVE C&apos;EST QUOI ?</h2>
              <div className="identity-tabs" aria-hidden="true">
                <span className="is-active">1</span>
                <span>2</span>
                <span>3</span>
              </div>
              <div className="identity-copy">
                <span className="identity-index">1</span>
                <h3>Notre vision</h3>
                <p>Former et préparer les professionnels du BTP aux réglementations actuelles et à subsister face à la concurrence accrue grâce à nos formations en énergies renouvelables.</p>
              </div>
            </div>
            <div>
              <div className="identity-note">
                <strong>Notre objectif</strong>
                <p>Vous faire acquérir rapidement des compétences spécifiques et répondre aux exigences de votre marché. Nos formations courtes sont conçues pour transmettre des connaissances théoriques et permettre aux participants de manipuler les équipements sur des plateaux techniques.</p>
                <strong>Notre organisme</strong>
                <p>La certification Qualiopi est un gage de qualité pour aborder une diversité de formations BTP comme le photovoltaïque, les pompes à chaleur, la sécurité au travail, la bureautique et les véhicules électriques.</p>
              </div>
              <div className="identity-photo" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.2), rgba(0, 77, 109, 0.2)), url(${heroImage})` }} />
            </div>
          </div>

          <div className="landing-center-cta">
            <a className="review-button" href={qualiopiCertificateUrl} rel="noreferrer" target="_blank">Certif Qualiopi</a>
          </div>

          <div className="landing-heading center stats-heading">
            <h2>Centre de formation professionnelle - Nos chiffres clés 2024</h2>
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
            <h2>Nos prochaines sessions de formation dans les énergies renouvelables</h2>
            <p>Inscrivez-vous à nos formations rapides et techniques pour les professionnels du bâtiment.</p>
          </div>

          <div className="landing-session-card">
            <div className="landing-calendar-shell">
              <div className="landing-calendar-top">
                <span>◀</span>
                <strong>Juin 2024</strong>
                <span>▶</span>
              </div>
              <div className="landing-calendar-days">
                <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
              </div>
              <div className="landing-calendar-grid">
                {Array.from({ length: 35 }, (_, index) => {
                  const label = index < 5 ? `${26 + index}` : `${index - 4}`;
                  const active = [18, 19, 20].includes(index);
                  return (
                    <span className={active ? "is-active" : undefined} key={`${label}-${index}`}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="landing-featured-session">
              <div className="featured-session-main">
                <h3>{featuredFormation?.shortTitle ?? "Formation"}</h3>
                <p>{featuredFormation?.summary ?? "Découvrez notre prochaine session disponible."}</p>
              </div>
              <div className="featured-session-facts">
                <div>
                  <span>Date</span>
                  <strong>{featuredSession ? formatDateRange(featuredSession.startDate, featuredSession.endDate) : "Juin 2024"}</strong>
                </div>
                <div>
                  <span>Lieu</span>
                  <strong>{featuredSession?.city ?? "Lyon"}</strong>
                </div>
                <div>
                  <span>Place</span>
                  <strong>{featuredSession?.seatsLeft ?? 12}</strong>
                </div>
              </div>
            </div>
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
          <div className="landing-heading center">
            <h2>Ils nous font confiance</h2>
          </div>
          <div className="trust-row" aria-hidden="true">
            <span>◀</span>
            <div className="trust-bubbles">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
            <span>▶</span>
          </div>
          <div className="landing-center-cta">
            <a className="review-button" href="https://oxideve.com" rel="noreferrer" target="_blank">Donnez votre avis G</a>
          </div>

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
              <h2>Votre journée type avec les formateurs Oxideve</h2>
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
        </Container>
      </Section>
    </>
  );
}
