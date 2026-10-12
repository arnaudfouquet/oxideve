"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";
import { getCategoryTheme } from "@/lib/formation-theme";

type SessionSummary = { startDate: string; endDate: string; city: string };

type Props = {
  formations: Formation[];
  categories: string[];
  durations: string[];
  /** Villes des sessions programmées, par slug de formation. */
  citiesByFormation: Record<string, string[]>;
  /** Prochaines sessions à venir, triées par date, par slug de formation. */
  sessionsByFormation: Record<string, SessionSummary[]>;
};

/** Minuscules sans accent, pour que "securite" trouve "Sécurité". */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** "2027-03-23" -> "2027-03", utilisé comme clé de filtre par mois. */
function monthKey(date: string) {
  return date.slice(0, 7);
}

/** "2027-03" -> "mars 2027". */
function monthLabel(key: string) {
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${key}-01T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2027-03-23" + "2027-03-24" -> "23 au 24 mars 2027". */
function formatSessionDates(session: SessionSummary) {
  const start = new Date(`${session.startDate}T00:00:00`);
  const end = new Date(`${session.endDate}T00:00:00`);
  const full = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (session.startDate === session.endDate) {
    return full.format(start);
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth ? `${start.getDate()} au ${full.format(end)}` : `${full.format(start)} au ${full.format(end)}`;
}

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

export function FormationCatalog({ formations, categories, durations, citiesByFormation, sessionsByFormation }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
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
  function matches(formation: Formation, skip?: "category" | "subCategory" | "duration" | "city" | "cpf" | "month") {
    const needle = normalize(search.trim());

    if (skip !== "category" && selectedCategories.length && !selectedCategories.includes(formation.category)) return false;
    if (skip !== "subCategory" && selectedSubCategories.length && !selectedSubCategories.includes(formation.subCategory || ""))
      return false;
    if (skip !== "duration" && selectedDurations.length && !selectedDurations.includes(formation.duration)) return false;
    if (skip !== "cpf" && cpfOnly && !formation.cpfEligible) return false;

    if (skip !== "city" && selectedCities.length) {
      const cities = citiesByFormation[formation.slug] || [];
      if (!cities.some((city) => selectedCities.includes(city))) return false;
    }

    if (skip !== "month" && selectedMonths.length) {
      const months = (sessionsByFormation[formation.slug] || []).map((session) => monthKey(session.startDate));
      if (!months.some((month) => selectedMonths.includes(month))) return false;
    }

    const price = parsePrice(formation.price);
    if (price !== null && activeMaxPrice && price > activeMaxPrice) return false;

    if (needle) {
      // On cherche aussi dans les villes réellement programmées : le champ
      // `location` ne porte que le lieu par défaut de la formation.
      const cities = (citiesByFormation[formation.slug] || []).join(" ");
      const haystack = [
        formation.title,
        formation.summary,
        formation.category,
        formation.subCategory,
        formation.levelLabel,
        formation.location,
        cities,
        formation.audience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!normalize(haystack).includes(needle)) return false;
    }

    return true;
  }

  const results = useMemo(
    () => formations.filter((formation) => matches(formation)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedCities, selectedDurations, selectedMonths, selectedSubCategories],
  );

  // Options encore pertinentes compte tenu des autres filtres actifs.
  const availableCategories = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "category"));
    return categories.filter((category) => pool.some((formation) => formation.category === category));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, categories, cpfOnly, formations, search, selectedCities, selectedDurations, selectedMonths, selectedSubCategories]);

  // Sous-familles pertinentes (ex. Électricité au sein de Sécurité au travail).
  const availableSubCategories = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "subCategory"));
    const values = new Set<string>();
    pool.forEach((formation) => {
      if (formation.subCategory) values.add(formation.subCategory);
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right, "fr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedCities, selectedDurations, selectedMonths, selectedSubCategories]);

  const availableDurations = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "duration"));
    return durations.filter((duration) => pool.some((formation) => formation.duration === duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, cpfOnly, durations, formations, search, selectedCategories, selectedCities, selectedMonths, selectedSubCategories]);

  const availableCities = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "city"));
    const cities = new Set<string>();
    pool.forEach((formation) => (citiesByFormation[formation.slug] || []).forEach((city) => cities.add(city)));
    return Array.from(cities).sort((left, right) => left.localeCompare(right, "fr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, citiesByFormation, cpfOnly, formations, search, selectedCategories, selectedDurations]);

  // Mois ayant au moins une session à venir, triés chronologiquement.
  const availableMonths = useMemo(() => {
    const pool = formations.filter((formation) => matches(formation, "month"));
    const months = new Set<string>();
    pool.forEach((formation) =>
      (sessionsByFormation[formation.slug] || []).forEach((session) => months.add(monthKey(session.startDate))),
    );
    return Array.from(months).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaxPrice, cpfOnly, formations, search, selectedCategories, selectedCities, selectedDurations, selectedSubCategories, sessionsByFormation]);

  const cpfAvailable = useMemo(
    () => formations.filter((formation) => matches(formation, "cpf")).some((formation) => formation.cpfEligible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMaxPrice, formations, search, selectedCategories, selectedCities, selectedDurations, selectedMonths, selectedSubCategories],
  );

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0 ||
    selectedDurations.length > 0 ||
    selectedCities.length > 0 ||
    selectedMonths.length > 0 ||
    cpfOnly ||
    Boolean(search.trim()) ||
    maxPrice > 0;

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedDurations([]);
    setSelectedCities([]);
    setSelectedMonths([]);
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

        {availableMonths.length ? (
          <FilterGroup title="Prochaines dates">
            {availableMonths.map((month) => (
              <label className="cat-check" key={month}>
                <input
                  checked={selectedMonths.includes(month)}
                  onChange={() => toggle(selectedMonths, setSelectedMonths, month)}
                  type="checkbox"
                />
                <span>{monthLabel(month)}</span>
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
                sessions={sessionsByFormation[formation.slug] || []}
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
function FormationResultCard({
  formation,
  cities,
  sessions,
}: {
  formation: Formation;
  cities: string[];
  sessions: SessionSummary[];
}) {
  const theme = getCategoryTheme(formation.category, formation.subCategory);
  const location = cities.length ? cities.join(", ") : formation.location;
  const nextSessions = sessions.slice(0, 2);

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
          {nextSessions.length ? (
            <li>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src="/assets/formations/icone-heure.svg" />
              <span className="cat-result-meta-label">Prochaines dates :</span>
              <span className="cat-result-meta-value">
                {nextSessions.map((session) => formatSessionDates(session)).join(" · ")}
              </span>
            </li>
          ) : null}
          <li>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/formations/icone-lieu.svg" />
            <span className="cat-result-meta-label">Ville :</span>
            <span className="cat-result-meta-value">{location}</span>
          </li>
          <li>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/assets/formations/icone-public.svg" />
            <span className="cat-result-meta-label">Pour qui&nbsp;:</span>
            <span className="cat-result-meta-value">{formation.audience}</span>
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
