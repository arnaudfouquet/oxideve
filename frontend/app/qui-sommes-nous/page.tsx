import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { getFormations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Découvrez Oxideve, son positionnement et ses grands univers de formation.",
};

const heroImage = "https://oxideve.com/wp-content/uploads/2024/10/Panneau-solaire-installateur-sur-un-toit-pose-photovoltaique-oxideve-200x300.webp";

const categoryImages: Record<string, string> = {
  "Sécurité au travail": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
  Bureautique: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  Management: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  Photovoltaïque: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
  "Pompes à chaleur": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  "Bornes de recharge": "https://images.unsplash.com/photo-1593941707882-a5bba53b3f87?auto=format&fit=crop&w=1200&q=80",
  "Traitement d'air": "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
};

const fallbackImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

export default async function QuiSommesNousPage() {
  const formations = await getFormations();
  const categoryOrder = [
    "Sécurité au travail",
    "Bureautique",
    "Management",
    "Photovoltaïque",
    "Pompes à chaleur",
    "Bornes de recharge",
    "Traitement d'air",
  ];

  const sections = categoryOrder
    .map((category) => ({
      title: `${category} :`,
      image: categoryImages[category] || fallbackImage,
      items: formations
        .filter((formation) => formation.category === category)
        .map((formation) => [formation.shortTitle, `/formations/${formation.slug}`] as [string, string]),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <section className="about-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.82), rgba(0, 77, 109, 0.82)), url(${heroImage})` }}>
        <div className="container about-hero-inner">
          <h1>Votre organisme de formation professionnel</h1>
        </div>
      </section>

      <section className="section">
        <div className="container about-intro-grid">
          <div>
            <h2>Pourquoi vous former avec OXIDEVE ?</h2>
            <p>Oxideve accompagne les professionnels qui souhaitent renforcer leurs compétences, quel que soit leur métier : sécurité, bureautique, management, habilitations ou énergies renouvelables.</p>
            <p>Nos programmes sont pensés pour associer pratique, réglementation, lecture technique et progression concrète sur le terrain.</p>
            <ul>
              <li>Formations métier courtes et applicables</li>
              <li>Plateaux techniques et cas concrets</li>
              <li>Accompagnement sur plusieurs univers professionnels</li>
            </ul>
          </div>
          <div className="about-wheel">
            <div className="day-type-wheel">
              <span>⛑</span>
              <span>💻</span>
              <span>🧭</span>
              <span>☀</span>
              <strong>?</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container training-section-stack">
          {sections.map((section) => (
            <article className="training-section-block" key={section.title}>
              <div className="training-section-banner" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.78), rgba(0, 77, 109, 0.78)), url(${section.image})` }}>
                <h2>{section.title}</h2>
              </div>
              <div className="training-section-grid">
                {section.items.map(([label, href]) => (
                  <div className="training-tile" key={label}>
                    <h3>{label}</h3>
                    <ButtonLink className="ui-button-card" href={href} variant="secondary">Découvrir</ButtonLink>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}