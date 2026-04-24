"use client";

import { useState } from "react";
import Link from "next/link";

const objectives = [
  {
    icon: "€",
    title: "Aider les particuliers à accéder à des aides financières",
    text: "Pour bénéficier d’aides financières pour leurs travaux, les particuliers doivent obligatoirement faire appel à des artisans certifiés RGE.",
    detail:
      "Ce label garantit que les aides publiques comme MaPrimeRénov’, les Certificats d’Économies d’Énergie ou l’Éco-PTZ sont attribuées à des projets respectant les exigences de l’État en matière de transition énergétique.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: "◎",
    title: "Valoriser une expertise contrôlée",
    text: "La certification RGE rassure les clients et donne un cadre clair à la qualité d’exécution attendue.",
    detail: "Les parcours Oxideve permettent de préparer les équipes à la qualification, à la conformité et à la lecture terrain des contrôles.",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: "✷",
    title: "Monter en compétence sur un label précis",
    text: "QualiPV, QualiPAC, IRVE ou d’autres labels exigent une logique de préparation structurée.",
    detail: "Vous choisissez le bon univers de certification puis vous préparez votre dossier avec des contenus adaptés à votre activité.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: "❋",
    title: "S’inscrire dans la transition énergétique",
    text: "La certification RGE participe directement à la qualité des travaux et à la confiance donnée aux professionnels du bâtiment.",
    detail: "Elle permet aussi de structurer durablement votre offre autour des marchés de la rénovation énergétique.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: "◍",
    title: "Pérenniser votre activité",
    text: "Être certifié renforce la lisibilité de votre offre et votre capacité à répondre aux attentes du marché.",
    detail: "Le parcours de formation devient alors un vrai levier commercial et opérationnel.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  },
];

const labels = [
  ["QualiPV", "Formez-vous pour installer des panneaux solaires"],
  ["QualiPAC", "Formez-vous pour installer des pompes à chaleur"],
  ["Qualisol", "Formez-vous pour installer des appareils de chauffage solaire"],
  ["Qualibois", "Formez-vous pour l’installation d’appareils de chauffage au bois"],
  ["Qualiforage", "Formez-vous pour réaliser des forages géothermiques"],
  ["IRVE", "Formez-vous pour installer des infrastructures de recharge"],
  ["Chauffage+", "Formez-vous pour installer des chaudières et de la condensation"],
  ["Ventilation+", "Formez-vous pour installer des ventilations mécaniques"],
];

const faqItems = [
  {
    title: "Connaître les organismes certificateurs",
    content: "Il s’agit de Qualit’EnR, Certibat, Qualibat ou Qualifelec selon le label visé et la nature de votre activité.",
  },
  {
    title: "Avantages des labels RGE",
    content: "Ils renforcent la confiance commerciale, ouvrent l’accès à des marchés réglementés et permettent à vos clients de mobiliser des aides.",
  },
  {
    title: "Devenir RGE : Combien de temps cela prend ?",
    content: "Le temps dépend du label et du dossier, mais la formation constitue la première étape structurante du parcours.",
  },
  {
    title: "Pourquoi choisir Oxideve pour vos formations RGE ?",
    content: "Parce que les parcours relient exigences certification, préparation du dossier et réalité chantier dans une même logique pédagogique.",
  },
  {
    title: "Formation BTP : Découvrez notre panel de formations",
    content: "Les parcours couvrent le photovoltaïque, la pompe à chaleur, l’IRVE, la sécurité et les autres enjeux techniques du bâtiment.",
  },
];

export function RgeExperience() {
  const [activeObjective, setActiveObjective] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const objective = objectives[activeObjective];

  return (
    <div className="rge-page-stack">
      <section className="rge-hero-block">
        <div className="rge-hero-copy">
          <span className="eyebrow">RGE</span>
          <h1>Certification RGE avec Oxideve</h1>
          <p>Une expertise reconnaissable grâce à votre certification, structurée autour des formations QualiPV, QualiPAC et IRVE.</p>
        </div>
      </section>

      <section className="rge-intro-grid">
        <div>
          <h2>Tout savoir sur la certification RGE</h2>
          <p>Pour contextualiser, en 2011 les pouvoirs publics français se joignent à l’ADEME pour se questionner quant à l’avenir de la transition énergétique et des économies d’énergie.</p>
          <p>C’est ainsi que la certification RGE a été développée. Cette démarche s’inscrit dans une dynamique nationale qui s’engage pour la qualité des travaux réalisés et la confiance accordée envers les professionnels du bâtiment.</p>
        </div>
        <div className="rge-intro-card">
          <strong>En bref</strong>
          <p>La certification RGE a été mise en place pour faire une distinction entre les professionnels du bâtiment.</p>
          <p>Les artisans certifiés peuvent garantir la qualité des travaux liés à la transition énergétique et favoriser l’installation d’équipements renouvelables grâce aux formations suivies en amont.</p>
        </div>
      </section>

      <section className="rge-objective-section">
        <h2>Connaître les objectifs de cette certification</h2>
        <div className="rge-objective-tabs" role="tablist" aria-label="Objectifs RGE">
          {objectives.map((item, index) => (
            <button className={`rge-objective-tab${index === activeObjective ? " active" : ""}`} key={item.title} onClick={() => setActiveObjective(index)} role="tab" type="button">
              {item.icon}
            </button>
          ))}
        </div>
        <div className="rge-objective-panel">
          <div className="rge-objective-copy">
            <span className="rge-objective-icon">{objective.icon}</span>
            <h3>{objective.title}</h3>
            <p>{objective.text}</p>
            <p>{objective.detail}</p>
          </div>
          <div className="rge-objective-visual">
            <img alt={objective.title} src={objective.image} />
          </div>
        </div>
      </section>

      <section className="rge-explain-grid">
        <div>
          <h2>En quoi consiste le label RGE ?</h2>
          <h3>Choisissez votre label RGE</h3>
          <p>L’artisan souhaitant obtenir une certification Reconnu Garant de l’Environnement doit d’abord choisir le label adapté à son activité.</p>
          <p>QualiPV pour les installations photovoltaïques, QualiPAC pour les pompes à chaleur ou IRVE pour les bornes de recharge pour véhicules électriques.</p>
        </div>
        <div className="rge-info-box">
          <p>La certification RGE est un label officiel valable 4 ans destiné aux professionnels du bâtiment et des énergies renouvelables.</p>
          <p>Obtenir un label RGE nécessite une formation spécifique, comme celles proposées chez Oxideve, où vous serez évalué pour garantir les compétences et la conformité du professionnel.</p>
          <span className="home-info-badge"><img alt="" src="/assets/info-icon.svg" /></span>
        </div>
      </section>

      <section className="rge-label-grid-shell">
        <div className="rge-label-grid">
          {labels.map(([name, text]) => (
            <article className="rge-label-card" key={name}>
              <strong>{name}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rge-become-grid">
        <h2>Devenez <span className="title-accent">artisan RGE</span></h2>
        <div className="rge-become-content">
          <img alt="Formation RGE" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80" />
          <div>
            <p>Vous souhaitez devenir artisan RGE à votre tour ?</p>
            <p>La formation est indispensable dans le processus de certification RGE alors formez-vous dans un organisme agréé, comme Oxideve, avec des formations adaptées à votre activité.</p>
            <Link className="ui-button ui-button-card" href="/formations?category=Photovolta%C3%AFque">Découvrir</Link>
          </div>
        </div>
      </section>

      <section className="rge-faq-shell">
        <h2>Devenez artisan RGE</h2>
        <div className="rge-faq-intro">
          <strong>Qui délivre la certification RGE ?</strong>
          <p>Pour obtenir votre certification RGE, rendez-vous dans un centre de formation professionnelle comme Oxideve, et suivez l’une de nos formations RGE.</p>
          <p>Une fois la formation validée, vous recevrez un lien pour effectuer votre demande auprès d’un organisme certificateur.</p>
        </div>
        <div className="rge-faq-list">
          {faqItems.map((item, index) => (
            <button className={`rge-faq-item${index === activeFaq ? " active" : ""}`} key={item.title} onClick={() => setActiveFaq(index)} type="button">
              <span>{item.title}</span>
              <strong>{index === activeFaq ? "−" : "⌄"}</strong>
            </button>
          ))}
        </div>
        <div className="rge-faq-content">
          <p>{faqItems[activeFaq].content}</p>
        </div>
      </section>
    </div>
  );
}