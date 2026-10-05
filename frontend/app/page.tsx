import { ButtonLink, Container } from "@/components/ui";
import { HomeSessionsCarousel } from "@/components/HomeSessionsCarousel";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

const heroImage = encodeURI("/assets/accueil/formation oxideve hero.jpg");

function categoryAnchor(category: string) {
  return `/formations#category-${category
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

const homeCategories = [
  { label: "Sécurité au travail", match: "Sécurité au travail" },
  { label: "Bureautique", match: "Bureautique" },
  { label: "Management", match: "Management" },
  { label: "Photovoltaïque", match: "Photovoltaïque" },
  { label: "Pompe à chaleur", match: "Pompes à chaleur" },
];

const advantages = [
  { title: "Diversité de formation", icon: encodeURI("/assets/accueil/diversite formation oxideve.svg") },
  { title: "Formations courtes et intenses", icon: encodeURI("/assets/accueil/formation courte intense oxideve.svg") },
  { title: "Plateaux techniques", icon: encodeURI("/assets/accueil/plateaux techniques oxideve.svg") },
  { title: "Suivi de l'évolution du marché", icon: encodeURI("/assets/accueil/formation evolution marche oxideve.svg") },
  { title: "Formateurs expérimentés", icon: encodeURI("/assets/accueil/formateurs experimentés oxideve.svg") },
  { title: "Organisme Qualiopi", icon: encodeURI("/assets/accueil/qualipio oxideve formation.svg"), link: { href: "/qui-sommes-nous", label: "Notre certificat" } },
  { title: "Elargir votre réseau", icon: encodeURI("/assets/accueil/reseau oxideve formation.svg") },
  { title: "Equipement de pointe et innovant", icon: encodeURI("/assets/accueil/equipement formation.svg") },
  { title: "Accompagnement post formation", icon: encodeURI("/assets/accueil/accompagenement formation qualipv.svg") },
];

const keyStats = [
  { value: "843", label: "Personnes formées", detail: "1er trimestre 2024" },
  { value: "166", label: "Journée de formation", detail: "1er trimestre 2024" },
  { value: "3,78/4", label: "Taux de satisfaction client", detail: "1er trimestre 2024" },
  { value: "14", label: "Années d'expérience", detail: "" },
];

const faqItems = [
  {
    question: "À qui s'adressent les formations Oxideve ?",
    answer:
      "À tous les professionnels souhaitant développer leurs compétences : salariés, dirigeants, indépendants ou demandeurs d'emploi, quel que soit leur secteur d'activité.",
  },
  {
    question: "Où se déroulent les formations ?",
    answer:
      "Selon la formation choisie, nos sessions peuvent être organisées partout en France, dans les agences de nos partenaires, directement dans votre entreprise ou à distance.",
  },
  {
    question: "Proposez-vous des formations à distance ?",
    answer:
      "Oui, certaines formations sont disponibles en visio. Les modalités disponibles sont précisées sur chaque fiche de formation.",
  },
  {
    question: "Est-il possible de faire financer sa formation ?",
    answer:
      "Oui, nos formations sont éligibles à différents dispositifs : OPCO, employeur, CPF, France Travail ou financement personnel. Notre équipe vous accompagne dans vos démarches.",
  },
  {
    question: "Les formations sont-elles accessibles aux personnes en situation de handicap ?",
    answer:
      "Oui, nous mettons tout en œuvre pour adapter nos formations. Contactez notre référent handicap pour étudier ensemble les aménagements possibles.",
  },
];

export default async function HomePage() {
  const formations = await getFormations();
  const sessions = await getSessions();

  const categoriesWithCount = homeCategories.map((category) => ({
    ...category,
    count: formations.filter((formation) => formation.category === category.match).length,
    href: categoryAnchor(category.match),
  }));

  return (
    <>
      {/* HERO */}
      <section className="home-hero">
        <Container className="home-hero-inner">
          <div className="home-hero-copy">
            <h1>
              Votre centre de
              <br />
              <strong>formation</strong>
              <br />
              <em>professionnelle</em>
            </h1>
            <p>
              Développez les compétences utiles à votre activité grâce à des formations concrètes, accessibles et adaptées à vos
              objectifs.
            </p>
            <ButtonLink href="/formations" variant="primary" className="home-hero-cta">
              Découvrir nos formations
            </ButtonLink>
          </div>
          <div className="home-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Équipe de professionnels en formation Oxideve" src={heroImage} />
          </div>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section className="home-categories">
        <Container>
          <h2 className="home-section-title">Trouvez la formation adaptée à vos besoins</h2>
          <div className="home-category-grid">
            {categoriesWithCount.map((category) => (
              <a className="home-category-card" href={category.href} key={category.label}>
                <span className="home-category-image" aria-hidden="true" />
                <span className="home-category-body">
                  <strong>{category.label}</strong>
                  <span className="home-category-foot">
                    <span className="home-category-count">{category.count} formation{category.count > 1 ? "s" : ""}</span>
                    <span className="home-category-arrow" aria-hidden="true">›</span>
                  </span>
                </span>
              </a>
            ))}
            <a className="home-category-card is-accent" href="/formations">
              <span className="home-category-accent-title">Toutes nos formations</span>
              <span className="home-category-arrow is-light" aria-hidden="true">›</span>
            </a>
          </div>
        </Container>
      </section>

      {/* SESSIONS CAROUSEL */}
      <HomeSessionsCarousel formations={formations} sessions={sessions} />

      {/* FORMEZ-VOUS OÙ QUE VOUS SOYEZ */}
      <section className="home-anywhere">
        <Container>
          <h2 className="home-section-title">Formez-vous où que vous soyez</h2>
          <p className="home-anywhere-text">
            Selon la formation choisie, nos sessions peuvent être organisées partout en France, dans les agences de nos partenaires
            Solipac et Téréva, directement dans votre entreprise ou à distance.
            <br />
            Les lieux et les modalités disponibles sont précisés sur chaque fiche de formation afin de vous permettre de choisir la
            solution la plus adaptée à vos besoins.
          </p>
          <div className="home-anywhere-visual" aria-hidden="true" />
        </Container>
      </section>

      {/* BANDE TERRAIN */}
      <section className="home-field">
        <Container>
          <h2>Des formations pensées pour la réalité du terrain</h2>
          <p>
            Chez Oxideve, nous privilégions une approche concrète, fondée sur la pratique, les échanges et les situations
            rencontrées dans votre activité. Selon la formation choisie, vous progressez grâce à des exercices, des mises en
            situation ou des manipulations sur nos plateaux techniques.
            <br />
            Nos formateurs expérimentés vous transmettent des connaissances et des méthodes directement applicables dans votre
            quotidien professionnel.
          </p>
          <ButtonLink href="/qui-sommes-nous" variant="primary" className="home-field-cta">
            En savoir plus sur Oxideve
          </ButtonLink>
        </Container>
      </section>

      {/* CHIFFRES */}
      <section className="home-stats">
        <Container>
          <h2 className="home-section-title">Oxideve en quelques chiffres</h2>
          <div className="home-stats-grid">
            {keyStats.map((stat, index) => (
              <div className={`home-stat-row${index % 2 === 1 ? " is-reversed" : ""}`} key={stat.label}>
                <div className="home-stat-card">
                  <strong>{stat.value}</strong>
                  <span>
                    {stat.label}
                    {stat.detail ? (
                      <>
                        <br />
                        {stat.detail}
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="home-stat-image" aria-hidden="true" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* POURQUOI CHOISIR */}
      <section className="home-why">
        <Container>
          <h2 className="home-section-title">Pourquoi choisir Oxideve pour vous former ?</h2>
          <div className="home-why-grid">
            {advantages.map((item) => (
              <article className="home-why-card" key={item.title}>
                <span className="home-why-icon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={item.icon} />
                </span>
                <strong>{item.title}</strong>
                {item.link ? (
                  <ButtonLink href={item.link.href} variant="primary" className="home-why-link">
                    {item.link.label}
                  </ButtonLink>
                ) : null}
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* AVIS */}
      <section className="home-reviews">
        <Container>
          <TestimonialCarousel />
          <ButtonLink href="/contact" variant="primary" className="home-reviews-cta">
            Je partage mon avis
          </ButtonLink>
        </Container>
      </section>

      {/* FINANCEMENT */}
      <section className="home-funding">
        <Container>
          <div className="home-funding-card">
            <h2>Financez votre formation !</h2>
            <p>
              OPCO, employeur, CPF, France Travail ou financement personnel : découvrez les solutions adaptées à votre situation et
              à la formation choisie.
            </p>
            <ButtonLink href="/contact" variant="primary">En savoir plus</ButtonLink>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="home-faq">
        <Container>
          <div className="home-faq-layout">
            <div className="home-faq-aside">
              <h2>
                Questions
                <br />
                fréquentes
              </h2>
              <div className="home-faq-cta-card">
                <h3>Un projet de formation ?</h3>
                <p>Notre équipe vous accompagne pour trouver la formation adaptée à votre besoin et répondre à vos questions</p>
                <ButtonLink href="/contact" variant="primary" className="home-faq-cta-button">
                  Échanger avec notre équipe
                </ButtonLink>
                <ButtonLink href="/formations" variant="primary" className="home-faq-cta-button">
                  Découvrir nos formations
                </ButtonLink>
              </div>
            </div>
            <div className="home-faq-list">
              {faqItems.map((item) => (
                <details className="home-faq-item" key={item.question}>
                  <summary>
                    <span>{item.question}</span>
                    <span className="home-faq-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
