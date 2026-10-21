import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { getFormations, getSessions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact et inscription",
  description: "Contactez Oxideve pour obtenir des informations ou réserver une formation.",
};

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

export default async function ContactPage() {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
  const firstFormation = formations[0];
  const firstSession = sessions.find((session) => session.formationSlug === firstFormation?.slug);

  return (
    <main className="ct-page">
      <section className="ct-hero">
        <Container className="ct-hero-inner">
          <h1 className="ct-hero-title">
            Nous <em>contacter</em>
          </h1>
          <p className="ct-hero-lead">
            Une question sur une formation, un financement ou une inscription ?
            <br />
            Décrivez-nous votre besoin : notre équipe vous rappelle et vous oriente vers le parcours adapté.
          </p>
        </Container>
      </section>

      <Container className="ct-layout">
        <div className="ct-form-card">
          <h2 className="ct-card-title">
            Parlez-nous de <em>votre projet</em>
          </h2>
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
              <ButtonLink href="/financement" variant="primary" className="home-cta-arrow ct-cta-blue">
                Financer ma formation
              </ButtonLink>
            </div>
          </div>
        </aside>
      </Container>
    </main>
  );
}
