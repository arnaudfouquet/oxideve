import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { contactAddress, contactEmail, contactPhone, getFormations, getSessions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact et inscription",
  description: "Contactez Oxideve pour obtenir des informations ou réserver une formation.",
};

export default async function ContactPage() {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
  const firstFormation = formations[0];
  const firstSession = sessions.find((session) => session.formationSlug === firstFormation?.slug);

  return (
    <section className="section">
      <div className="container contact-layout">
        <div className="contact-card">
          <span className="eyebrow">Contact</span>
          <h1>Contactez Oxideve</h1>
          <p>Utilisez cette page pour poser une question, demander des informations ou préparer votre inscription.</p>
          <div className="detail-list">
            <p>Téléphone: {contactPhone}</p>
            <p>Email: {contactEmail}</p>
            <p>Adresse: {contactAddress}</p>
          </div>
        </div>
        <div className="contact-card">
          <ContactForm
            defaultFormationSlug={firstFormation?.slug}
            defaultSessionId={firstSession?.id}
            submitLabel="Envoyer la demande"
          />
        </div>
      </div>
    </section>
  );
}
