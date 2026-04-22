import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { contactEmail, contactPhone } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact et inscription",
  description: "Contactez Oxideve pour planifier une session, qualifier un besoin entreprise ou réserver une formation.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container contact-layout">
        <div className="contact-card">
          <span className="eyebrow">Contact</span>
          <h1>Parler à un responsable formation</h1>
          <p>Cette page reste disponible pour les demandes générales, les partenariats et les besoins hors catalogue standard.</p>
          <div className="detail-list">
            <p>Téléphone: {contactPhone}</p>
            <p>Email: {contactEmail}</p>
            <p>Adresse: Rouen, interventions intra-entreprise possibles.</p>
          </div>
        </div>
        <div className="contact-card">
          <ContactForm submitLabel="Envoyer la demande" />
        </div>
      </div>
    </section>
  );
}
