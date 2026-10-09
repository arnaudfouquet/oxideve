import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Financement",
  description:
    "OPCO, CPF, France Travail ou autofinancement : découvrez les solutions pour financer votre formation professionnelle chez Oxideve et les démarches à effectuer.",
};

type AnchorItem = {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
};

type Scheme = {
  id: string;
  pill: string;
  icon: string;
  title: string;
  intro: string;
  body: string;
  stepsTitle: string;
  steps: string[];
  info: string;
  footerQuestion: string;
  ctaLabel: string;
  ctaHref: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const anchors: AnchorItem[] = [
  {
    href: "#opco",
    icon: "/assets/financement/opco-vert.svg",
    title: "OPCO et Entreprise",
    subtitle: "salariés",
  },
  {
    href: "#cpf",
    icon: "/assets/financement/cpf-vert.svg",
    title: "CPF",
    subtitle: "Droit acquis",
  },
  {
    href: "#france-travail",
    icon: "/assets/financement/france-travail-vert.svg",
    title: "France Travail",
    subtitle: "demandeurs d'emploi",
  },
  {
    href: "#autofinancement",
    icon: "/assets/financement/auto-vert.svg",
    title: "Autofinancement",
    subtitle: "À titre personnel",
  },
  {
    href: "#faq",
    icon: "/assets/financement/faq-vert.svg",
    title: "FAQ",
    subtitle: "Questions fréquentes",
  },
];

const schemes: Scheme[] = [
  {
    id: "opco",
    pill: "Dispositif Salariés",
    icon: "/assets/financement/opco-bleu.svg",
    title: "Financer une formation avec un OPCO",
    intro:
      "Les opérateurs de compétences, appelés OPCO, accompagnent les entreprises dans le financement de la formation professionnelle de leurs salariés.",
    body: "Les formations proposées par Oxideve peuvent faire l'objet d'une demande de prise en charge auprès de votre OPCO. Le montant financé dépend notamment de votre secteur d'activité, de la taille de votre entreprise, de la formation choisie et des critères définis par votre branche professionnelle.",
    stepsTitle: "Comment effectuer votre demande ?",
    steps: [
      "Identifiez l'OPCO dont dépend votre entreprise.",
      "Contactez-le pour connaître les conditions de prise en charge.",
      "Demandez à Oxideve le programme et le devis de la formation.",
      "Transmettez votre dossier avant le début de la session.",
      "Attendez l'accord de votre OPCO avant de confirmer votre financement.",
    ],
    info: "Votre employeur peut également choisir de financer directement votre formation dans le cadre du plan de développement des compétences de l'entreprise.",
    footerQuestion: "Prêt à entamer vos démarches OPCO ?",
    ctaLabel: "Demander un devis",
    ctaHref: "/contact",
  },
  {
    id: "cpf",
    pill: "Droits Acquis",
    icon: "/assets/financement/cpf-bleu.svg",
    title: "Financer une formation avec votre Compte personnel de formation (CPF)",
    intro:
      "Le Compte personnel de formation, ou CPF, permet aux personnes actives d'acquérir des droits mobilisables pour suivre certaines formations certifiantes.",
    body: "Certaines formations proposées par Oxideve sont éligibles au CPF et peuvent être financées en mobilisant les droits disponibles sur votre Compte personnel de formation.",
    stepsTitle: "Comment mobiliser votre CPF ?",
    steps: [
      "Connectez-vous à votre espace Mon Compte Formation.",
      "Consultez le montant de vos droits disponibles.",
      "Recherchez la formation Oxideve concernée.",
      "Déposez votre demande d'inscription directement sur la plateforme.",
    ],
    info: "Une participation financière peut rester à votre charge, sauf dans les situations donnant droit à une exonération. Si vos droits sont insuffisants, un financement complémentaire peut parfois être demandé auprès de votre employeur, de votre OPCO ou de France Travail.",
    footerQuestion: "Vous souhaitez vérifier l'éligibilité CPF d'une formation ?",
    ctaLabel: "Nous contacter",
    ctaHref: "/contact",
  },
  {
    id: "france-travail",
    pill: "Demandeurs d'emploi",
    icon: "/assets/financement/france-travail-bleu.svg",
    title: "Financer une formation avec France Travail",
    intro:
      "France Travail peut participer au financement d'une formation lorsqu'elle s'inscrit dans votre projet de retour à l'emploi.",
    body: "La prise en charge dépend de votre situation, de votre projet professionnel et de la validation de votre conseiller référent.",
    stepsTitle: "Comment effectuer votre demande ?",
    steps: [
      "Échangez avec votre conseiller France Travail sur votre projet.",
      "Demandez à Oxideve le programme et le devis de la formation.",
      "Transmettez les documents à votre conseiller.",
      "Attendez la validation avant de débuter la formation.",
    ],
    info: "Les délais d'instruction peuvent être longs : anticipez votre demande plusieurs semaines avant le début de la session visée.",
    footerQuestion: "Besoin des documents pour votre conseiller ?",
    ctaLabel: "Demander un devis",
    ctaHref: "/contact",
  },
  {
    id: "autofinancement",
    pill: "À titre personnel",
    icon: "/assets/financement/auto-bleu.svg",
    title: "Financer votre formation par vos propres moyens",
    intro:
      "Vous pouvez également financer votre formation directement, sans passer par un dispositif externe.",
    body: "Cette solution permet de s'inscrire rapidement, sans dépendre des délais d'instruction d'un organisme financeur.",
    stepsTitle: "Comment procéder ?",
    steps: [
      "Choisissez la formation et la session qui vous conviennent.",
      "Demandez votre devis à Oxideve.",
      "Validez votre inscription.",
      "Réglez selon les modalités indiquées sur votre convention.",
    ],
    info: "Un échelonnement du règlement peut être étudié selon la formation et la situation. Parlez-en à notre équipe.",
    footerQuestion: "Vous souhaitez vous inscrire directement ?",
    ctaLabel: "Voir les formations",
    ctaHref: "/formations",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Toutes les formations Oxideve peuvent-elles être financées ?",
    answer:
      "La plupart de nos formations peuvent faire l'objet d'une prise en charge. Les modalités varient selon le dispositif et la formation : contactez-nous pour vérifier votre situation.",
  },
  {
    question: "Quelles formations sont éligibles au CPF ?",
    answer:
      "Seules les formations certifiantes référencées sur Mon Compte Formation sont éligibles. Nous vous indiquons celles qui le sont lors de votre demande.",
  },
  {
    question: "Combien de temps faut-il prévoir pour obtenir un financement ?",
    answer:
      "Comptez généralement plusieurs semaines entre le dépôt du dossier et l'accord de l'organisme. Anticipez votre demande avant le début de la session visée.",
  },
  {
    question: "Oxideve peut-il effectuer les démarches à ma place ?",
    answer:
      "Nous vous transmettons tous les documents nécessaires (programme, devis, convention) et vous guidons, mais la demande doit être déposée par vous ou votre employeur.",
  },
  {
    question: "Que se passe-t-il si mon financement est refusé ?",
    answer:
      "Vous pouvez étudier un autre dispositif, un financement complémentaire ou un autofinancement. Notre équipe vous aide à trouver une solution.",
  },
];

export default function FinancementPage() {
  return (
    <main className="fin-page">
      <section className="fin-hero">
        <Container className="fin-hero-inner">
          <h1 className="fin-hero-title">
            Comment financer
            <br />
            <strong>ma formation</strong> <em>professionnelle</em>
          </h1>
          <p className="fin-hero-lead">
            Selon votre situation et la formation choisie, plusieurs solutions peuvent vous aider à
            financer votre parcours chez Oxideve.
          </p>
          <p className="fin-hero-accent">
            Prise en charge par votre employeur ou votre OPCO, mobilisation de votre CPF, aide de
            France Travail ou financement personnel : découvrez la solution correspondant à votre
            projet
          </p>
          <div className="fin-hero-actions">
            <ButtonLink href="#dispositifs" variant="primary" className="home-cta-arrow fin-cta-white">
              Explorer les dispositifs
            </ButtonLink>
            <ButtonLink href="/contact" variant="primary" className="home-cta-arrow fin-cta-green">
              être conseillé
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container>
        <nav className="fin-anchor-bar" aria-label="Dispositifs de financement">
          {anchors.map((anchor) => (
            <a className="fin-anchor" href={anchor.href} key={anchor.href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fin-anchor-icon" src={anchor.icon} alt="" />
              <span className="fin-anchor-title">{anchor.title}</span>
              <span className="fin-anchor-subtitle">{anchor.subtitle}</span>
            </a>
          ))}
        </nav>
      </Container>

      <section className="fin-schemes" id="dispositifs">
        <Container className="fin-schemes-inner">
          {schemes.map((scheme) => (
            <article className="fin-card" id={scheme.id} key={scheme.id}>
              <header className="fin-card-head">
                <span className="fin-pill-blue">{scheme.pill}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fin-card-icon" src={scheme.icon} alt="" />
              </header>
              <h2 className="fin-card-title">{scheme.title}</h2>
              <p className="fin-card-intro">{scheme.intro}</p>
              <p className="fin-card-body">{scheme.body}</p>

              <div className="fin-card-grid">
                <div className="fin-panel">
                  <h3 className="fin-panel-title">{scheme.stepsTitle}</h3>
                  <ol className="fin-steps">
                    {scheme.steps.map((step, index) => (
                      <li className="fin-step" key={step}>
                        <span className="fin-step-number" aria-hidden="true">
                          {index + 1}
                        </span>
                        <span className="fin-step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="fin-panel fin-panel-info">
                  <span className="fin-info-badge" aria-hidden="true">
                    i
                  </span>
                  <p className="fin-info-text">{scheme.info}</p>
                </div>
              </div>

              <hr className="fin-card-divider" />

              <footer className="fin-card-footer">
                <p className="fin-card-question">{scheme.footerQuestion}</p>
                <ButtonLink href={scheme.ctaHref} variant="primary" className="home-cta-arrow fin-cta-blue">
                  {scheme.ctaLabel}
                </ButtonLink>
              </footer>
            </article>
          ))}
        </Container>
      </section>

      <section className="fin-support">
        <Container>
          <div className="fin-support-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="fin-support-bubble" src="/assets/financement/bulle.png" alt="" />
            <h2 className="fin-support-title">Oxideve vous accompagne dans vos démarches</h2>
            <p className="fin-support-text">
              Vous ne savez pas quel financement correspond à votre situation ? Notre équipe vous
              aide à identifier les démarches à effectuer et vous transmet les documents nécessaires
              à votre demande : programme, devis et informations sur la session choisie.
            </p>
            <p className="fin-support-note">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fin-support-note-icon" src="/assets/financement/attention.svg" alt="" />
              <span>
                L&apos;accord de financement reste toutefois délivré par l&apos;employeur ou
                l&apos;organisme financeur concerné.
              </span>
            </p>
            <ButtonLink href="/contact" variant="primary" className="home-cta-arrow fin-support-cta">
              Échanger avec notre équipe
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="fin-faq" id="faq">
        <Container>
          <div className="home-faq-layout">
            <div className="home-faq-aside">
              <span className="fin-pill-navy">FAQ</span>
              <h2>
                Questions
                <br />
                fréquentes
              </h2>
            </div>
            <div className="home-faq-list">
              {faqItems.map((item) => (
                <details className="home-faq-item" key={item.question}>
                  <summary>
                    <span>{item.question}</span>
                    <span className="home-faq-chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
