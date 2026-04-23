import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { contactEmail, contactPhone } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact et inscription",
  description: "Contactez Oxideve pour obtenir des informations ou réserver une formation.",
};

export default function ContactPage() {
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
            <p>Adresse: Rouen.</p>
          </div>
        </div>
        <div className="contact-card">
          <ContactForm submitLabel="Envoyer la demande" />
        </div>
      </div>
    </section>
  );
}
