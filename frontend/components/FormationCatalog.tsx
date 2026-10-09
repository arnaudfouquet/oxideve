"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";
import { getCategoryTheme } from "@/lib/formation-theme";

type Props = {
  formations: Formation[];
  categories: string[];
  durations: string[];
};

/** "1 190 EUR" -> 1190 ; renvoie null si aucun nombre exploitable. */
function parsePrice(price: string): number | null {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number.parseInt(digits, 10) : null;
}

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="cat-filter-group" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="cat-filter-group-body">{children}</div>
    </details>
  );
}

export function FormationCatalog({ formations, categories, durations }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [cpfOnly, setCpfOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [search, setSearch] = useState("");

  const priceCeiling = useMemo(() => {
    const values = formations.map((item) => parsePrice(item.price)).filter((value): value is number => value !== null);
    if (!values.length) return 0;
    return Math.ceil(Math.max(...values) / 100) * 100;
  }, [formations]);

  const activeMaxPrice = maxPrice || priceCeiling;

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  const results = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return formations.filter((formation) => {
      if (selectedCategories.length && !selectedCategories.includes(formation.category)) return false;
      if (selectedDurations.length && !selectedDurations.includes(formation.duration)) return false;
      if (cpfOnly && !formation.cpfEligible) return false;

      const price = parsePrice(formation.price);
      if (price !== null && activeMaxPrice && price > activeMaxPrice) return false;

      if (needle) {
        const haystack = `${formation.title} ${formation.summary} ${formation.category} ${formation.location} ${formation.audience}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedDurations]);

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedDurations.length > 0 || cpfOnly || Boolean(search.trim()) || maxPrice > 0;

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedDurations([]);
    setCpfOnly(false);
    setMaxPrice(0);
    setSearch("");
  }

  return (
    <div className="cat-layout">
      <aside className="cat-sidebar">
        <div className="cat-sidebar-head">
          <span className="cat-sidebar-title">
            Filtrer
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
          </span>
          {hasActiveFilters ? (
            <button className="cat-reset" onClick={resetFilters} type="button">
              Réinitialiser
            </button>
          ) : null}
        </div>

        <FilterGroup title="Recherche">
          <input
            className="ui-field cat-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mot-clé, métier, ville..."
            value={search}
          />
        </FilterGroup>

        <FilterGroup title="Domaine">
          {categories.map((category) => (
            <label className="cat-check" key={category}>
              <input
                checked={selectedCategories.includes(category)}
                onChange={() => toggle(selectedCategories, setSelectedCategories, category)}
                type="checkbox"
              />
              <span>{category}</span>
            </label>
          ))}
        </FilterGroup>

        <FilterGroup title="Financement">
          <label className="cat-check">
            <input checked={cpfOnly} onChange={(event) => setCpfOnly(event.target.checked)} type="checkbox" />
            <span>Finançable CPF</span>
          </label>
        </FilterGroup>

        {priceCeiling ? (
          <FilterGroup title="Prix de la formation">
            <div className="cat-range-values">
              <span>0 €</span>
              <span>{activeMaxPrice} €</span>
            </div>
            <input
              className="cat-range"
              max={priceCeiling}
              min={0}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              step={50}
              type="range"
              value={activeMaxPrice}
            />
          </FilterGroup>
        ) : null}

        <FilterGroup title="Durée">
          {durations.map((duration) => (
            <label className="cat-check" key={duration}>
              <input
                checked={selectedDurations.includes(duration)}
                onChange={() => toggle(selectedDurations, setSelectedDurations, duration)}
                type="checkbox"
              />
              <span>{duration}</span>
            </label>
          ))}
        </FilterGroup>
      </aside>

      <div className="cat-results">
        <p className="cat-results-count">
          {results.length} formation{results.length > 1 ? "s" : ""}
          {hasActiveFilters ? " correspondant à vos critères" : " disponibles"}
        </p>

        {results.length ? (
          <div className="cat-results-list">
            {results.map((formation) => (
              <FormationResultCard formation={formation} key={formation.slug} />
            ))}
          </div>
        ) : (
          <p className="catalog-empty">Aucune formation ne correspond à ces critères. Élargissez votre recherche.</p>
        )}
      </div>
    </div>
  );
}

/** Carte horizontale de la liste de résultats. */
function FormationResultCard({ formation }: { formation: Formation }) {
  const theme = getCategoryTheme(formation.category);

  return (
    <article className="cat-result">
      <div className="cat-result-body">
        <div className="cat-result-head">
          <span className="formation-tile-category">{formation.category}</span>
          <span className="formation-tile-duration">{formation.duration}</span>
        </div>

        <h3 className="cat-result-title">
          {formation.title}
          {formation.levelLabel ? <em> - {formation.levelLabel}</em> : null}
        </h3>

        <p className="cat-result-summary">{formation.summary}</p>

        <ul className="cat-result-meta">
          <li>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/formations/icone-lieu.svg" />
            {formation.location}
          </li>
          <li>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/formations/icone-public.svg" />
            {formation.audience}
          </li>
        </ul>

        <div className="cat-result-foot">
          <div className="formation-tile-price-block">
            {formation.cpfEligible ? <span className="formation-tile-cpf">Finançable CPF</span> : null}
            <strong className="formation-tile-price">{formation.price}</strong>
          </div>
          <Link className="ui-button ui-button-primary home-cta-arrow" href={`/formations/${formation.slug}`}>
            Découvrir
          </Link>
        </div>
      </div>

      <div className="cat-result-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={theme.banner} />
      </div>
    </article>
  );
}

/** Carte verticale réutilisée par la page détail ("formations complémentaires"). */
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
