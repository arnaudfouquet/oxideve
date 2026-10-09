import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
import { FranceMap } from "@/components/FranceMap";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Découvrez Oxideve, organisme de formation professionnelle : notre organisme, notre approche et nos engagements.",
};

const categories = [
  {
    label: "Sécurité au travail",
    description: "Prévenez les risques et adoptez les bons gestes au travail.",
    image: "/assets/home/cat-securite.jpg",
  },
  {
    label: "Bureautique",
    description: "Développez votre maîtrise des outils numériques professionnels.",
    image: "/assets/home/cat-bureautique.jpg",
  },
  {
    label: "Management",
    description: "Renforcez vos compétences pour accompagner et faire progresser votre équipe.",
    image: "/assets/home/cat-management.jpg",
  },
  {
    label: "Photovoltaïque",
    description: "Développez vos compétences dans l'installation et la maîtrise des équipements photovoltaïques.",
    image: "/assets/home/cat-photovoltaique.jpg",
  },
  {
    label: "Pompe à chaleur",
    description: "Apprenez à installer, mettre en service et entretenir les pompes à chaleur.",
    image: "/assets/home/cat-pompe-chaleur.jpg",
  },
  {
    label: "Bornes de recharge (IRVE)",
    description: "Apprenez à installer et mettre en service des bornes de recharge.",
    image: "/assets/formations/banner-irve.webp",
  },
  {
    label: "Climatisation et fluides frigorigènes",
    description: "Intervenez en conformité sur les équipements de traitement d'air.",
    image: "/assets/formations/banner-clim.webp",
  },
];

const approach = [
  {
    icon: "/assets/qsn/apprendre.svg",
    title: "Apprendre par la pratique",
    text: "Exercices, échanges, mises en situation ou manipulations : nos méthodes s'adaptent à chaque formation.",
  },
  {
    icon: "/assets/qsn/formateurs.svg",
    title: "Des formateurs expérimentés",
    text: "Nos intervenants associent expertise métier et pédagogie pour transmettre leurs connaissances clairement.",
  },
  {
    icon: "/assets/qsn/contenus.svg",
    title: "Des contenus actualisés",
    text: "Nos programmes évoluent avec les métiers, les technologies et les réglementations.",
  },
];

export default function QuiSommesNousPage() {
  return (
    <>
      {/* HERO */}
      <section className="qsn-hero">
        <div className="qsn-hero-inner">
          <div className="qsn-hero-copy">
            <h1>
              Oxideve, organisme
              <br />
              de <strong>formation</strong>
              <br />
              <em>professionnelle</em>
            </h1>
            <p>
              Créé en 2018, Oxideve est né de la volonté d&apos;accompagner les professionnels dans le développement de leurs
              compétences, au plus près de leurs besoins et des réalités du terrain.
            </p>
            <p>
              Au fil des années, notre organisme a développé et diversifié son offre afin de s&apos;adresser à des métiers, des
              secteurs et des profils variés.
            </p>
            <p>
              Aujourd&apos;hui, Séverine et l&apos;équipe Oxideve proposent des formations concrètes et accessibles à toutes les
              personnes souhaitant apprendre, se perfectionner ou faire évoluer leurs pratiques professionnelles.
            </p>
            <ButtonLink href="/formations" variant="primary" className="home-cta-arrow">
              Découvrir nos formations
            </ButtonLink>
          </div>

          <div className="qsn-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Séverine Germanneau, responsable Oxideve" src="/assets/qsn/severine.webp" />
            <p className="qsn-hero-caption">
              <strong>Severine GERMANNEAU</strong>
              <em>Responsable OXIDEVE</em>
            </p>
          </div>
        </div>
      </section>

      {/* NOTRE ORGANISME */}
      <section className="qsn-organisme">
        <Container>
          <div className="qsn-organisme-layout">
            <div className="qsn-organisme-card">
              <h2>Notre organisme</h2>
              <p>
                Oxideve propose des formations professionnelles dans des domaines variés, avec une expertise reconnue dans les
                métiers techniques, de l&apos;énergie et du génie climatique.
              </p>
              <p className="qsn-organisme-goal">
                Notre objectif : transmettre des connaissances et des méthodes directement applicables dans le quotidien
                professionnel.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="qsn-organisme-schema" alt="" src="/assets/qsn/schema.webp" />
          </div>
        </Container>
      </section>

      {/* NOTRE PRÉSENCE */}
      <section className="qsn-presence">
        <Container>
          <h2 className="qsn-section-title">
            <strong>Notre présence</strong> <span>(carte)</span>
          </h2>
          <div className="home-anywhere-map">
            <FranceMap />
          </div>
        </Container>
      </section>

      {/* OFFRE DE FORMATION */}
      <section className="qsn-offer">
        <Container>
          <h2 className="qsn-section-title">Une offre de formation diversifiée</h2>
          <div className="home-category-grid">
            {categories.map((category) => (
              <a className="home-category-card" href="/formations" key={category.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="home-category-image" alt={category.label} src={category.image} />
                <span className="home-category-body">
                  <strong>{category.label}</strong>
                  <span className="home-category-foot">
                    <span className="qsn-category-text">{category.description}</span>
                    <span className="home-category-arrow" aria-hidden="true">›</span>
                  </span>
                </span>
              </a>
            ))}
            <a className="home-category-card is-accent" href="/formations">
              <span className="home-category-accent-title">
                Développez vos compétences dans le domaine <strong>qui correspond à votre activité et à vos objectifs.</strong>
              </span>
              <span className="home-category-arrow is-light" aria-hidden="true">›</span>
            </a>
          </div>
        </Container>
      </section>

      {/* NOTRE APPROCHE */}
      <section className="qsn-approach">
        <Container>
          <h2>Notre approche</h2>
          <div className="qsn-approach-grid">
            {approach.map((item) => (
              <article className="qsn-approach-item" key={item.title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={item.icon} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ENGAGEMENTS + CTA */}
      <section className="qsn-closing">
        <Container>
          <div className="qsn-closing-layout">
            <div className="qsn-commitments">
              <h2>Nos engagements</h2>

              <h3>La qualité</h3>
              <p>Oxideve est certifié Qualiopi au titre de ses actions de formation.</p>
              <ButtonLink href="/contact" variant="primary" className="qsn-commitment-cta home-cta-arrow">
                Consulter notre certificat
              </ButtonLink>

              <h3>L&apos;accessibilité</h3>
              <p>
                Nous étudions les besoins des personnes en situation de handicap afin d&apos;identifier les adaptations
                pédagogiques possibles.
              </p>
              <ButtonLink href="/contact" variant="primary" className="qsn-commitment-cta home-cta-arrow">
                Nous contacter
              </ButtonLink>
            </div>

            <div className="qsn-project">
              <h2>
                Faisons avancer votre
                <br />
                projet de formation
              </h2>
              <div className="qsn-project-card">
                <h3>Un projet de formation ?</h3>
                <p>
                  Besoin d&apos;aide pour choisir votre formation ou préparer votre inscription ? Notre équipe est à votre écoute.
                </p>
                <ButtonLink href="/contact" variant="primary" className="qsn-project-cta home-cta-arrow">
                  Échanger avec notre équipe
                </ButtonLink>
                <ButtonLink href="/formations" variant="primary" className="qsn-project-cta home-cta-arrow">
                  Trouver ma formation
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
