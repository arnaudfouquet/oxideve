import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { getFormations, getSessions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact et inscription",
  description: "Contactez Oxideve pour obtenir des informations ou réserver une formation.",
};

const contactAddress = "39 av Jean François Champollion, 31100 Toulouse";
const contactEmail = "contact@oxideve.com";
const contactPhone = "06.36.44.55.93";

type ContactChannel = {
  icon: string;
  label: string;
  value: string;
  hint: string;
  href?: string;
};

const channels: ContactChannel[] = [
  {
    icon: "/assets/formations/icone-lieu.svg",
    label: "Nous rendre visite",
    value: contactAddress,
    hint: "Siège et centre de formation à Toulouse.",
  },
  {
    icon: "/assets/formations/icone-public.svg",
    label: "Nous écrire",
    value: contactEmail,
    hint: "Réponse sous 48 heures ouvrées.",
    href: `mailto:${contactEmail}`,
  },
  {
    icon: "/assets/formations/icone-heure.svg",
    label: "Nous appeler",
    value: contactPhone,
    hint: "Du lundi au vendredi, de 9h à 18h.",
    href: `tel:+33${contactPhone.replace(/\D/g, "").slice(1)}`,
  },
];

const legalItems = [
  "Organisme de formation déclaré auprès du préfet de l'Occitanie n° 76 66 022 09 66",
  "SIRET : 840 764 310 000 24",
  "APE : 8559A",
];

const assurances = [
  {
    icon: "/assets/formations/icone-euro.svg",
    title: "Financements accompagnés",
    text: "OPCO, CPF, France Travail ou autofinancement : nous vous guidons dans vos démarches.",
  },
  {
    icon: "/assets/formations/icone-heure.svg",
    title: "Réponse rapide",
    text: "Chaque demande est étudiée par un conseiller et traitée sous 48 heures ouvrées.",
  },
  {
    icon: "/assets/formations/icone-public.svg",
    title: "Parcours sur mesure",
    text: "Sessions inter, intra ou formats adaptés à vos équipes et à vos contraintes.",
  },
];

export default async function ContactPage() {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
  const firstFormation = formations[0];
  const firstSession = sessions.find((session) => session.formationSlug === firstFormation?.slug);

  return (
    <main className="ct-page">
      <section className="ct-hero">
        <Container className="ct-hero-inner">
          <span className="ct-pill">Contact</span>
          <h1 className="ct-hero-title">
            Nous <em>contacter</em>
          </h1>
          <p className="ct-hero-lead">
            Une question sur une formation, un financement ou une inscription ? Décrivez-nous votre
            besoin : notre équipe vous rappelle et vous oriente vers le parcours adapté.
          </p>
        </Container>
      </section>

      <Container className="ct-layout">
        <div className="ct-form-card">
          <span className="ct-pill ct-pill-green">Votre demande</span>
          <h2 className="ct-card-title">
            Parlez-nous de <em>votre projet</em>
          </h2>
          <p className="ct-card-lead">
            Renseignez vos coordonnées et le contexte de votre demande. Les champs marqués sont
            nécessaires au traitement de votre dossier.
          </p>
          <ContactForm
            defaultFormationSlug={firstFormation?.slug}
            defaultSessionId={firstSession?.id}
            submitLabel="Envoyer la demande"
          />
        </div>

        <aside className="ct-aside">
          <div className="ct-channels">
            {channels.map((channel) => (
              <article className="ct-channel" key={channel.label}>
                <span className="ct-channel-icon" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={channel.icon} alt="" />
                </span>
                <div className="ct-channel-body">
                  <span className="ct-channel-label">{channel.label}</span>
                  {channel.href ? (
                    <a className="ct-channel-value" href={channel.href}>
                      {channel.value}
                    </a>
                  ) : (
                    <span className="ct-channel-value">{channel.value}</span>
                  )}
                  <span className="ct-channel-hint">{channel.hint}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="ct-legal-card">
            <h3 className="ct-legal-title">Informations administratives</h3>
            <ul className="ct-legal-list">
              {legalItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="ct-links-card">
            <h3 className="ct-links-title">Avant de nous écrire</h3>
            <p className="ct-links-text">
              Consultez le catalogue pour identifier la formation visée, ou les dispositifs de prise
              en charge disponibles selon votre situation.
            </p>
            <div className="ct-links-actions">
              <ButtonLink href="/formations" variant="primary" className="home-cta-arrow ct-cta-blue">
                Voir les formations
              </ButtonLink>
              <ButtonLink href="/financement" variant="primary" className="home-cta-arrow ct-cta-green">
                Financer ma formation
              </ButtonLink>
            </div>
          </div>
        </aside>
      </Container>

      <section className="ct-assurance">
        <Container>
          <div className="ct-assurance-grid">
            {assurances.map((item) => (
              <article className="ct-assurance-card" key={item.title}>
                <span className="ct-assurance-icon" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.icon} alt="" />
                </span>
                <h3 className="ct-assurance-title">{item.title}</h3>
                <p className="ct-assurance-text">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
