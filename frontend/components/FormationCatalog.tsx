"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";
import { getCategoryTheme, indexCategoryVisuals, type CategoryVisual } from "@/lib/formation-theme";

type SessionSummary = { startDate: string; endDate: string; city: string; mode: string };

type Props = {
  formations: Formation[];
  categories: string[];
  /** Villes des sessions programmées, par slug de formation. */
  citiesByFormation: Record<string, string[]>;
  /** Prochaines sessions à venir, triées par date, par slug de formation. */
  sessionsByFormation: Record<string, SessionSummary[]>;
  /** Visuels de catégorie et sous-catégorie réglés dans l'admin. */
  categoryVisuals?: CategoryVisual[];
};

type SortKey = "session" | "price" | "duration" | "title";

/** Dispositifs de financement proposés en filtre. */
type FundingKey = "opco" | "cpf" | "france-travail";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "session", label: "Prochaine session" },
  { value: "price", label: "Prix croissant" },
  { value: "duration", label: "Durée" },
  { value: "title", label: "Ordre alphabétique" },
];

const FUNDING_OPTIONS: { value: FundingKey; label: string }[] = [
  { value: "opco", label: "OPCO" },
  { value: "cpf", label: "CPF" },
  { value: "france-travail", label: "France Travail" },
];

const PAGE_SIZE = 12;
const REMOTE_MODE = "Distanciel";

/**
 * OPCO et France Travail concernent toutes les formations ; le CPF dépend de
 * l'éligibilité portée par la formation.
 */
function matchesFunding(formation: Formation, funding: FundingKey) {
  return funding === "cpf" ? Boolean(formation.cpfEligible) : true;
}

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

/** "2027-03" -> "Mars 2027". */
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

/** "1,5 jour" -> 1.5, pour pouvoir trier les durées. */
function parseDuration(duration: string): number {
  const match = duration.replace(",", ".").match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : Number.POSITIVE_INFINITY;
}

function FilterGroup({
  title,
  children,
  defaultOpen = true,
  alwaysOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
}) {
  // Sur mobile les groupes sont repliés : dépliés, ils repoussaient la
  // première formation très bas dans la page.
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (alwaysOpen) return;

    const narrow = window.matchMedia("(max-width: 1024px)");
    const sync = () => setOpen(narrow.matches ? false : defaultOpen);

    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, [alwaysOpen, defaultOpen]);

  return (
    <details className="cat-filter-group" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
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

/** Case à cocher d'une facette, avec le nombre de résultats correspondants. */
function FacetCheck({
  checked,
  count,
  label,
  onChange,
}: {
  checked: boolean;
  count: number;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="cat-check">
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span>{label}</span>
      <span className="cat-check-count">{count}</span>
    </label>
  );
}

export function FormationCatalog({
  formations,
  categories,
  citiesByFormation,
  sessionsByFormation,
  categoryVisuals = [],
}: Props) {
  const visualIndex = useMemo(() => indexCategoryVisuals(categoryVisuals), [categoryVisuals]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedFunding, setSelectedFunding] = useState<FundingKey[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("session");
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Restaure l'état depuis l'URL au premier rendu (lien partagé, retour arrière).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const list = (key: string) => (params.get(key) ? params.get(key)!.split(",").filter(Boolean) : []);

    const requestedCategories = list("categorie").filter((item) => categories.includes(item));
    if (requestedCategories.length) setSelectedCategories(requestedCategories);

    setSelectedCities(list("ville"));
    setSelectedMonths(list("mois"));
    setSelectedFunding(list("financement").filter((item): item is FundingKey =>
      FUNDING_OPTIONS.some((option) => option.value === item),
    ));
    setRemoteOnly(params.get("distanciel") === "1");
    setSearch(params.get("q") || "");

    const requestedSort = params.get("tri");
    if (SORT_OPTIONS.some((option) => option.value === requestedSort)) setSort(requestedSort as SortKey);

    setHydrated(true);
  }, [categories]);

  // Reflète l'état courant dans l'URL, sans empiler d'entrées d'historique.
  useEffect(() => {
    if (!hydrated) return;

    const params = new URLSearchParams();
    const set = (key: string, values: string[]) => {
      if (values.length) params.set(key, values.join(","));
    };

    set("categorie", selectedCategories);
    set("ville", selectedCities);
    set("mois", selectedMonths);
    set("financement", selectedFunding);
    if (remoteOnly) params.set("distanciel", "1");
    if (search.trim()) params.set("q", search.trim());
    if (sort !== "session") params.set("tri", sort);

    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [hydrated, remoteOnly, search, selectedCategories, selectedCities, selectedFunding, selectedMonths, sort]);

  // Filtrer raccourcit la liste : la position de scroll d'avant peut ne plus
  // exister, et le navigateur colle alors le visiteur en bas de page sans
  // qu'il comprenne pourquoi. On recadre donc sur le haut du catalogue, mais
  // seulement s'il est deja sorti de l'ecran — sinon on bougerait la page
  // alors que le visiteur voit deja ses resultats. La recherche texte est
  // volontairement exclue : elle sauterait a chaque caractere saisi.
  useEffect(() => {
    if (!hydrated) return;

    const layout = layoutRef.current;
    if (!layout) return;

    if (layout.getBoundingClientRect().top >= 0) return;

    layout.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hydrated, remoteOnly, selectedCategories, selectedCities, selectedFunding, selectedMonths, sort]);

  function toggle<T extends string>(list: T[], setList: (next: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setPage(1);
  }

  /**
   * Applique tous les filtres sauf celui qu'on est en train de construire :
   * cela permet de compter les résultats par option et de masquer celles qui
   * n'en donnent aucun.
   */
  function matches(formation: Formation, skip?: "category" | "city" | "month" | "remote" | "funding") {
    const needle = normalize(search.trim());
    const sessions = sessionsByFormation[formation.slug] || [];

    if (skip !== "category" && selectedCategories.length && !selectedCategories.includes(formation.category)) return false;
    if (skip !== "remote" && remoteOnly && !sessions.some((session) => session.mode === REMOTE_MODE)) return false;

    if (skip !== "funding" && selectedFunding.length) {
      if (!selectedFunding.some((funding) => matchesFunding(formation, funding))) return false;
    }

    if (skip !== "city" && selectedCities.length) {
      const cities = citiesByFormation[formation.slug] || [];
      if (!cities.some((city) => selectedCities.includes(city))) return false;
    }

    if (skip !== "month" && selectedMonths.length) {
      const months = sessions.map((session) => monthKey(session.startDate));
      if (!months.some((month) => selectedMonths.includes(month))) return false;
    }

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
        .join(" ");

      if (!normalize(haystack).includes(needle)) return false;
    }

    return true;
  }

  const results = useMemo(() => {
    const kept = formations.filter((formation) => matches(formation));

    return kept.sort((left, right) => {
      if (sort === "price") {
        return (parsePrice(left.price) ?? Infinity) - (parsePrice(right.price) ?? Infinity);
      }

      if (sort === "duration") {
        return parseDuration(left.duration) - parseDuration(right.duration);
      }

      if (sort === "title") {
        return left.title.localeCompare(right.title, "fr");
      }

      // Par défaut : la formation dont la prochaine session arrive le plus tôt.
      const leftDate = sessionsByFormation[left.slug]?.[0]?.startDate || "9999-12-31";
      const rightDate = sessionsByFormation[right.slug]?.[0]?.startDate || "9999-12-31";
      return leftDate.localeCompare(rightDate);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formations, remoteOnly, search, selectedCategories, selectedCities, selectedFunding, selectedMonths, sessionsByFormation, sort]);

  /** Compte les formations restantes si l'on cochait `value` sur cette facette. */
  function countFor(skip: Parameters<typeof matches>[1], predicate: (formation: Formation) => boolean) {
    return formations.filter((formation) => matches(formation, skip) && predicate(formation)).length;
  }

  const categoryFacets = useMemo(
    () =>
      categories
        .map((category) => ({ value: category, count: countFor("category", (f) => f.category === category) }))
        .filter((facet) => facet.count > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, formations, remoteOnly, search, selectedCities, selectedFunding, selectedMonths],
  );

  const monthFacets = useMemo(() => {
    const values = new Set<string>();
    formations.forEach((formation) =>
      (sessionsByFormation[formation.slug] || []).forEach((session) => values.add(monthKey(session.startDate))),
    );

    return Array.from(values)
      .sort()
      .map((value) => ({
        value,
        count: countFor("month", (f) =>
          (sessionsByFormation[f.slug] || []).some((session) => monthKey(session.startDate) === value),
        ),
      }))
      .filter((facet) => facet.count > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formations, remoteOnly, search, selectedCategories, selectedCities, selectedFunding, sessionsByFormation]);

  const cityFacets = useMemo(() => {
    const values = new Set<string>();
    formations.forEach((formation) => (citiesByFormation[formation.slug] || []).forEach((city) => values.add(city)));

    return Array.from(values)
      .sort((left, right) => left.localeCompare(right, "fr"))
      .map((value) => ({
        value,
        count: countFor("city", (f) => (citiesByFormation[f.slug] || []).includes(value)),
      }))
      .filter((facet) => facet.count > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesByFormation, formations, remoteOnly, search, selectedCategories, selectedFunding, selectedMonths]);

  const fundingFacets = useMemo(
    () =>
      FUNDING_OPTIONS.map((option) => ({
        ...option,
        count: countFor("funding", (formation) => matchesFunding(formation, option.value)),
      })).filter((facet) => facet.count > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formations, remoteOnly, search, selectedCategories, selectedCities, selectedMonths],
  );

  const remoteCount = countFor("remote", (formation) =>
    (sessionsByFormation[formation.slug] || []).some((session) => session.mode === REMOTE_MODE),
  );

  /** Pastilles des filtres actifs, chacune supprimable d'un clic. */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];

    if (search.trim()) chips.push({ key: "q", label: `« ${search.trim()} »`, clear: () => setSearch("") });

    selectedCategories.forEach((value) =>
      chips.push({ key: `cat-${value}`, label: value, clear: () => toggle(selectedCategories, setSelectedCategories, value) }),
    );
    selectedMonths.forEach((value) =>
      chips.push({ key: `month-${value}`, label: monthLabel(value), clear: () => toggle(selectedMonths, setSelectedMonths, value) }),
    );
    selectedCities.forEach((value) =>
      chips.push({ key: `city-${value}`, label: value, clear: () => toggle(selectedCities, setSelectedCities, value) }),
    );
    selectedFunding.forEach((value) => {
      const label = FUNDING_OPTIONS.find((option) => option.value === value)?.label || value;
      chips.push({ key: `fund-${value}`, label, clear: () => toggle(selectedFunding, setSelectedFunding, value) });
    });

    if (remoteOnly) chips.push({ key: "remote", label: "À distance", clear: () => setRemoteOnly(false) });

    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteOnly, search, selectedCategories, selectedCities, selectedFunding, selectedMonths]);

  const hasActiveFilters = activeChips.length > 0;

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedCities([]);
    setSelectedMonths([]);
    setSelectedFunding([]);
    setRemoteOnly(false);
    setSearch("");
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleResults = results.slice(0, currentPage * PAGE_SIZE);

  return (
    <div className="cat-layout" ref={layoutRef}>
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

        {/* La recherche reste dépliée, y compris sur mobile. */}
        <FilterGroup alwaysOpen title="Recherche">
          <input
            className="ui-field cat-search"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Mot-clé, métier, ville..."
            value={search}
          />
        </FilterGroup>

        {categoryFacets.length ? (
          <FilterGroup title="Domaine">
            {categoryFacets.map((facet) => (
              <FacetCheck
                checked={selectedCategories.includes(facet.value)}
                count={facet.count}
                key={facet.value}
                label={facet.value}
                onChange={() => toggle(selectedCategories, setSelectedCategories, facet.value)}
              />
            ))}
          </FilterGroup>
        ) : null}

        {monthFacets.length ? (
          <FilterGroup title="Prochaines dates">
            {monthFacets.map((facet) => (
              <FacetCheck
                checked={selectedMonths.includes(facet.value)}
                count={facet.count}
                key={facet.value}
                label={monthLabel(facet.value)}
                onChange={() => toggle(selectedMonths, setSelectedMonths, facet.value)}
              />
            ))}
          </FilterGroup>
        ) : null}

        {cityFacets.length ? (
          <FilterGroup title="Ville">
            {cityFacets.map((facet) => (
              <FacetCheck
                checked={selectedCities.includes(facet.value)}
                count={facet.count}
                key={facet.value}
                label={facet.value}
                onChange={() => toggle(selectedCities, setSelectedCities, facet.value)}
              />
            ))}
          </FilterGroup>
        ) : null}

        {fundingFacets.length ? (
          <FilterGroup title="Financement">
            {fundingFacets.map((facet) => (
              <FacetCheck
                checked={selectedFunding.includes(facet.value)}
                count={facet.count}
                key={facet.value}
                label={facet.label}
                onChange={() => toggle(selectedFunding, setSelectedFunding, facet.value)}
              />
            ))}
          </FilterGroup>
        ) : null}

        {remoteCount ? (
          <FilterGroup title="Modalité">
            <FacetCheck
              checked={remoteOnly}
              count={remoteCount}
              label="Sessions à distance"
              onChange={() => {
                setRemoteOnly((value) => !value);
                setPage(1);
              }}
            />
          </FilterGroup>
        ) : null}
      </aside>

      <div className="cat-results">
        <div className="cat-results-bar">
          <p className="cat-results-count">
            {results.length} formation{results.length > 1 ? "s" : ""}
            {hasActiveFilters ? " correspondant à vos critères" : " disponibles"}
          </p>

          <label className="cat-sort">
            <span>Trier par</span>
            <select
              className="ui-field"
              onChange={(event) => {
                setSort(event.target.value as SortKey);
                setPage(1);
              }}
              value={sort}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeChips.length ? (
          <div className="cat-chips">
            {activeChips.map((chip) => (
              <button className="cat-chip" key={chip.key} onClick={chip.clear} type="button">
                {chip.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button className="cat-chip cat-chip-clear" onClick={resetFilters} type="button">
              Tout effacer
            </button>
          </div>
        ) : null}

        {visibleResults.length ? (
          <>
            <div className="cat-results-list">
              {visibleResults.map((formation) => (
                <FormationResultCard
                  cities={citiesByFormation[formation.slug] || []}
                  formation={formation}
                  key={formation.slug}
                  sessions={sessionsByFormation[formation.slug] || []}
                  visuals={visualIndex}
                />
              ))}
            </div>

            {currentPage < pageCount ? (
              <div className="cat-more">
                <button className="ui-button ui-button-primary home-cta-arrow" onClick={() => setPage(currentPage + 1)} type="button">
                  Voir plus de formations
                </button>
                <span className="cat-more-count">
                  {visibleResults.length} sur {results.length}
                </span>
              </div>
            ) : null}
          </>
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
  visuals,
}: {
  formation: Formation;
  cities: string[];
  sessions: SessionSummary[];
  visuals: Record<string, CategoryVisual>;
}) {
  const theme = getCategoryTheme(formation.category, formation.subCategory, formation, visuals);
  const location = cities.length ? cities.join(", ") : formation.location;
  const nextSessions = sessions.slice(0, 2);

  return (
    <article className="cat-result">
      <div className="cat-result-body">
        <div className="cat-result-head">
          <span className="formation-tile-category">{formation.category}</span>
          <span className="formation-tile-duration">{formation.duration}</span>
          {/* Dispositifs de financement, dans le même ordre que le filtre. */}
          {FUNDING_OPTIONS.filter((option) => matchesFunding(formation, option.value)).map((option) => (
            <span className={`formation-tile-funding formation-tile-funding-${option.value}`} key={option.value}>
              {option.label}
            </span>
          ))}
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
            <span className="cat-result-meta-label">Pour qui :</span>
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
        <img alt="" src={theme.banner} style={theme.tilePosition ? { objectPosition: theme.tilePosition } : undefined} />
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
