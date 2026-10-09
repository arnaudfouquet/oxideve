"use client";

import { useMemo, useState } from "react";
import { NewsCard } from "./NewsCard";
import type { Article } from "../../shared/types";

type NewsCategoryFilterProps = {
  articles: Article[];
};

const ALL = "Toutes";

export function NewsCategoryFilter({ articles }: NewsCategoryFilterProps) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((article) => article.category)));
    return [ALL, ...unique];
  }, [articles]);

  const [active, setActive] = useState(ALL);

  const visible = active === ALL ? articles : articles.filter((article) => article.category === active);

  return (
    <div className="news-collection">
      {categories.length > 2 ? (
        <div className="news-filters" role="tablist" aria-label="Filtrer par categorie">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active === category}
              className={`news-filter${active === category ? " news-filter-active" : ""}`}
              onClick={() => setActive(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="news-grid">
          {visible.map((article) => (
            <NewsCard article={article} key={article.slug} />
          ))}
        </div>
      ) : (
        <p className="news-empty">Aucun article dans cette categorie pour le moment.</p>
      )}
    </div>
  );
}
