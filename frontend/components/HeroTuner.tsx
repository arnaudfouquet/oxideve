"use client";

import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui";

/**
 * Générateur de réglages du hero de la page d'accueil.
 *
 * L'aperçu est le vrai hero, rendu avec les mêmes classes que la page : ce
 * qu'on voit ici est exactement ce que donnera le site. Les curseurs pilotent
 * des variables CSS, et le panneau du bas produit le CSS à recopier.
 */

/** Valeurs retenues par Oxideve, reprises comme réglage par défaut. */
const DEFAULTS = {
  imageWidth: 74,
  bandLeft: 70,
  bandSlope: 30,
  cornerLeft: -10,
  cornerBottom: -25,
  cornerWidth: 280,
  cornerHeight: 375,
  cornerSlope: 32,
};

type Settings = typeof DEFAULTS;

const STORAGE_KEY = "oxideve-hero-tuner";

const FIELDS: { key: keyof Settings; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "imageWidth", label: "Largeur de l'image", min: 20, max: 100, step: 1, unit: "%" },
  { key: "bandLeft", label: "Bande verte : départ en haut", min: 0, max: 100, step: 1, unit: "%" },
  { key: "bandSlope", label: "Bande verte : décalage du bas", min: -40, max: 80, step: 1, unit: "%" },
  { key: "cornerWidth", label: "Coin bas-gauche : largeur", min: 0, max: 600, step: 5, unit: "px" },
  { key: "cornerHeight", label: "Coin bas-gauche : hauteur", min: 0, max: 500, step: 5, unit: "px" },
  { key: "cornerSlope", label: "Coin bas-gauche : pente", min: 0, max: 100, step: 1, unit: "%" },
  { key: "cornerLeft", label: "Coin bas-gauche : décalage horizontal", min: -200, max: 400, step: 5, unit: "px" },
  { key: "cornerBottom", label: "Coin bas-gauche : décalage vertical", min: -200, max: 300, step: 5, unit: "px" },
];

export function HeroTuner() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [copied, setCopied] = useState(false);

  // Les réglages survivent au rechargement : on tâtonne souvent en plusieurs fois.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {
      /* stockage indisponible : on garde les valeurs par défaut */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* sans gravité */
    }
  }, [settings]);

  const cssVariables = {
    "--hero-image-width": `${settings.imageWidth}%`,
    "--hero-band-left": `${settings.bandLeft}%`,
    "--hero-band-slope": `${settings.bandSlope}%`,
    "--hero-corner-left": `${settings.cornerLeft}px`,
    "--hero-corner-bottom": `${settings.cornerBottom}px`,
    "--hero-corner-width": `${settings.cornerWidth}px`,
    "--hero-corner-height": `${settings.cornerHeight}px`,
    "--hero-corner-slope": `${settings.cornerSlope}%`,
  } as React.CSSProperties;

  // CSS prêt à coller dans globals.css, sous la forme d'un bloc de variables.
  const generatedCss = useMemo(
    () =>
      [
        ".home-hero {",
        `  --hero-image-width: ${settings.imageWidth}%;`,
        `  --hero-band-left: ${settings.bandLeft}%;`,
        `  --hero-band-slope: ${settings.bandSlope}%;`,
        `  --hero-corner-left: ${settings.cornerLeft}px;`,
        `  --hero-corner-bottom: ${settings.cornerBottom}px;`,
        `  --hero-corner-width: ${settings.cornerWidth}px;`,
        `  --hero-corner-height: ${settings.cornerHeight}px;`,
        `  --hero-corner-slope: ${settings.cornerSlope}%;`,
        "}",
      ].join("\n"),
    [settings],
  );

  function update(key: keyof Settings, value: number) {
    setSettings((current) => ({ ...current, [key]: value }));
    setCopied(false);
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="hero-tuner">
      <header className="hero-tuner-head">
        <div>
          <h1>Générateur du hero</h1>
          <p>
            Déplacez les curseurs : l&apos;aperçu ci-dessous est le vrai hero de la page d&apos;accueil. Quand le
            rendu vous convient, copiez le CSS et envoyez-le moi.
          </p>
        </div>
        <button className="hero-tuner-reset" onClick={() => setSettings(DEFAULTS)} type="button">
          Réinitialiser
        </button>
      </header>

      {/* Aperçu : copie exacte du hero de la page d'accueil. */}
      <section className="home-hero hero-tuner-preview" style={cssVariables}>
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
              Développez les compétences utiles à votre activité grâce à des formations concrètes, accessibles et
              adaptées à vos objectifs.
            </p>
            <span className="ui-button ui-button-primary home-hero-cta home-cta-arrow">Découvrir nos formations</span>
          </div>
          <div className="home-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/home/illustration-home.png" />
          </div>
        </Container>
      </section>

      <div className="hero-tuner-panel">
        <div className="hero-tuner-fields">
          {FIELDS.map((field) => (
            <label className="hero-tuner-field" key={field.key}>
              <span>
                {field.label}
                <em>
                  {settings[field.key]}
                  {field.unit === "deg" ? "°" : field.unit}
                </em>
              </span>
              <input
                max={field.max}
                min={field.min}
                onChange={(event) => update(field.key, Number(event.target.value))}
                step={field.step}
                type="range"
                value={settings[field.key]}
              />
            </label>
          ))}
        </div>

        <div className="hero-tuner-output">
          <div className="hero-tuner-output-head">
            <strong>CSS à recopier</strong>
            <button onClick={copyCss} type="button">
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <pre>{generatedCss}</pre>
          <p className="hero-tuner-hint">
            Ce bloc se colle dans <code>frontend/app/globals.css</code>, ou vous me l&apos;envoyez et je l&apos;applique.
          </p>
        </div>
      </div>
    </div>
  );
}
