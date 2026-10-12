"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";
import { getCategoryTheme } from "@/lib/formation-theme";

type Props = {
  formations: Formation[];
  categories: string[];
  durations: string[];
  /** Villes des sessions programmées, par slug de formation. */
  citiesByFormation: Record<string, string[]>;
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

export function FormationCatalog({ formations, categories, durations, citiesByFormation }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cpfOnly, setCpfOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [search, setSearch] = useState("");

  // Pré-sélectionne le domaine quand on arrive depuis une carte de catégorie.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("categorie");
    if (requested && categories.includes(requested)) {
      setSelectedCategories([requested]);
    }
  }, [categories]);

  const priceCeiling = useMemo(() => {
    const values = formations.map((item) => parsePrice(item.price)).filter((value): value is number => value !== null);
    if (!values.length) return 0;
    return Math.ceil(Math.max(...values) / 100) * 100;
  }, [formations]);

  const activeMaxPrice = maxPrice || priceCeiling;

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  /**
   * Applique tous les filtres sauf celui qu'on est en train de construire :
   * cela permet de savoir quelles options d'une facette donnent encore des
   * résultats, et donc de masquer celles qui n'en donnent aucun.
   */
  function matches(formation: Formation, skip?: "category" | "subCategory" | "duration" | "city" | "cpf") {
    const needle = search.trim().toLowerCase();

    if (skip !== "category" && selectedCategories.length && !selectedCategories.includes(formation.category)) return false;
    if (skip !== "subCategory" && selectedSubCategories.length && !selectedSubCategories.includes(formation.subCategory || ""))
      return false;
    if (skip !== "duration" && selectedDurations.length && !selectedDurations.includes(formation.duration)) return false;
    if (skip !== "cpf" && cpfOnly && !formation.cpfEligible) return false;

    if (skip !== "city" && selectedCities.length) {
      const cities = citiesByFormation[formation.slug] || [];
      if (!cities.some((city) => selectedCities.includes(city))) return false;
    }

    const price = parsePrice(formation.price);
    if (price !== null && activeMaxPrice && price > activeMaxPrice) return false;

    if (needle) {
      const haystack = `${formation.title} ${formation.summary} ${formation.category} ${formation.location} ${formation.audience}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  }

  const results = useMemo(
    () => formations.filter((formation) => matches(formation)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedCities, selectedDurations, selectedSubCategories],
  );

  // Options encore pertinentes compte tenu des autres filtres actifs.
  const availableCategories = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "category"));
    return categories.filter((category) => pool.some((formation) => formation.category === category));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, categories, cpfOnly, formations, search, selectedCities, selectedDurations, selectedSubCategories]);

  // Sous-familles pertinentes (ex. Électricité au sein de Sécurité au travail).
  const availableSubCategories = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "subCategory"));
    const values = new Set<string>();
    pool.forEach((formation) => {
      if (formation.subCategory) values.add(formation.subCategory);
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right, "fr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedCities, selectedDurations, selectedSubCategories]);

  const availableDurations = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "duration"));
    return durations.filter((duration) => pool.some((formation) => formation.duration === duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, cpfOnly, durations, formations, search, selectedCategories, selectedCities, selectedSubCategories]);

  const availableCities = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "city"));
    const cities = new Set<string>();
    pool.forEach((formation) => (citiesByFormation[formation.slug] || []).forEach((city) => cities.add(city)));
    return Array.from(cities).sort((left, right) => left.localeCompare(right, "fr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, citiesByFormation, cpfOnly, formations, search, selectedCategories, selectedDurations]);

  const cpfAvailable = useMemo(
    () => formations.filter((formation) => matches(formation, "cpf")).some((formation) => formation.cpfEligible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMaxPrice, formations, search, selectedCategories, selectedCities, selectedDurations, selectedSubCategories],
  );

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0 ||
    selectedDurations.length > 0 ||
    selectedCities.length > 0 ||
    cpfOnly ||
    Boolean(search.trim()) ||
    maxPrice > 0;

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedDurations([]);
    setSelectedCities([]);
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

        {availableCategories.length ? (
          <FilterGroup title="Domaine">
            {availableCategories.map((category) => (
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
        ) : null}

        {availableSubCategories.length ? (
          <FilterGroup title="Spécialité">
            {availableSubCategories.map((subCategory) => (
              <label className="cat-check" key={subCategory}>
                <input
                  checked={selectedSubCategories.includes(subCategory)}
                  onChange={() => toggle(selectedSubCategories, setSelectedSubCategories, subCategory)}
                  type="checkbox"
                />
                <span>{subCategory}</span>
              </label>
            ))}
          </FilterGroup>
        ) : null}

        {availableCities.length ? (
          <FilterGroup title="Ville">
            {availableCities.map((city) => (
              <label className="cat-check" key={city}>
                <input
                  checked={selectedCities.includes(city)}
                  onChange={() => toggle(selectedCities, setSelectedCities, city)}
                  type="checkbox"
                />
                <span>{city}</span>
              </label>
            ))}
          </FilterGroup>
        ) : null}

        {cpfAvailable ? (
          <FilterGroup title="Financement">
            <label className="cat-check">
              <input checked={cpfOnly} onChange={(event) => setCpfOnly(event.target.checked)} type="checkbox" />
              <span>Finançable CPF</span>
            </label>
          </FilterGroup>
        ) : null}

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

        {availableDurations.length ? (
          <FilterGroup title="Durée">
            {availableDurations.map((duration) => (
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
        ) : null}
      </aside>

      <div className="cat-results">
        <p className="cat-results-count">
          {results.length} formation{results.length > 1 ? "s" : ""}
          {hasActiveFilters ? " correspondant à vos critères" : " disponibles"}
        </p>

        {results.length ? (
          <div className="cat-results-list">
            {results.map((formation) => (
              <FormationResultCard
                cities={citiesByFormation[formation.slug] || []}
                formation={formation}
                key={formation.slug}
              />
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
function FormationResultCard({ formation, cities }: { formation: Formation; cities: string[] }) {
  const theme = getCategoryTheme(formation.category, formation.subCategory);
  const location = cities.length ? cities.join(", ") : formation.location;

  return (
    <article className="cat-result">
      <div className="cat-result-body">
        <div className="cat-result-head">
          <span className="formation-tile-category">{formation.category}</span>
          <span className="formation-tile-duration">{formation.duration}</span>
          {formation.cpfEligible ? <span className="formation-tile-cpf">Finançable CPF</span> : null}
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
            <span className="cat-result-meta-label">Ville</span>
            <strong className="cat-result-meta-value">{location}</strong>
          </li>
          <li>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/formations/icone-public.svg" />
            <span className="cat-result-meta-label">Pour qui&nbsp;?</span>
            <strong className="cat-result-meta-value">{formation.audience}</strong>
          </li>
        </ul>

        <div className="cat-result-foot">
          <strong className="formation-tile-price">{formation.price}</strong>
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
