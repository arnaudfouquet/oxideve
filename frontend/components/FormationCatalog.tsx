"use client";

import { useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";
import { getCategoryTheme } from "@/lib/formation-theme";

type Props = {
  formations: Formation[];
  categories: string[];
};

export function FormationCatalog({ formations, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0] || "");

  const theme = getCategoryTheme(activeCategory);
  const visibleFormations = formations.filter((formation) => formation.category === activeCategory);

  return (
    <>
      <div className="catalog-filters">
        {categories.map((category) => (
          <button
            className={`catalog-filter${category === activeCategory ? " is-active" : ""}`}
            key={category}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="catalog-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={activeCategory} src={theme.banner} />
        <p className="catalog-banner-text">{theme.blurb}</p>
      </div>

      <div className="catalog-grid">
        {visibleFormations.map((formation) => (
          <FormationCatalogCard formation={formation} key={formation.slug} />
        ))}
        {!visibleFormations.length ? (
          <p className="catalog-empty">Aucune formation dans cette catégorie pour le moment.</p>
        ) : null}
      </div>
    </>
  );
}

export function FormationCatalogCard({ formation }: { formation: Formation }) {
  return (
    <article className="formation-tile">
      <div className="formation-tile-head">
        <span className="formation-tile-category">{formation.category}</span>
        <span className="formation-tile-duration">{formation.duration}</span>
      </div>

      <h3 className="formation-tile-title">
        {formation.title}
        {formation.levelLabel ? <em> - {formation.levelLabel}</em> : null}
      </h3>

      <p className="formation-tile-summary">{formation.summary}</p>

      <div className="formation-tile-foot">
        <div className="formation-tile-price-block">
          {formation.cpfEligible ? <span className="formation-tile-cpf">Finançable CPF</span> : null}
          <strong className="formation-tile-price">{formation.price}</strong>
        </div>
        <Link className="ui-button ui-button-primary home-cta-arrow" href={`/formations/${formation.slug}`}>
          Découvrir
        </Link>
      </div>
    </article>
  );
}
