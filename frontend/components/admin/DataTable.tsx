"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Largeur minimale d'une colonne pendant un redimensionnement. */
const MIN_COLUMN_WIDTH = 48;

export type DataTableColumn<T> = {
  key: string;
  label: string;
  headerRender?: () => React.ReactNode;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  width?: string;
  sortValue?: (row: T) => string | number;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyLabel?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  getRowClassName?: (row: T) => string;
  className?: string;
  /**
   * Active le redimensionnement des colonnes à la souris. Les largeurs sont
   * mémorisées dans le navigateur sous cette clé. Nécessite un tableau en
   * mise en page fixe (table-layout: fixed).
   */
  resizeKey?: string;
};

type SortState = {
  key: string;
  direction: "asc" | "desc";
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyLabel = "Aucune donnée.",
  pageSize = 15,
  onRowClick,
  isRowActive,
  getRowClassName,
  className,
  resizeKey,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);

  const tableRef = useRef<HTMLTableElement>(null);
  // Vrai pendant un glissement : le clic qui le termine ne doit pas trier.
  const resizingRef = useRef(false);
  const storageKey = resizeKey ? `oxideve-colonnes-${resizeKey}` : "";
  const [customWidths, setCustomWidths] = useState<Record<string, string>>({});

  // Largeurs choisies lors d'une visite précédente.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setCustomWidths(JSON.parse(saved));
    } catch {
      /* stockage indisponible : largeurs par défaut */
    }
  }, [storageKey]);

  function widthFor(column: DataTableColumn<T>) {
    return customWidths[column.key] || column.width;
  }

  function saveWidths(next: Record<string, string>) {
    if (!storageKey) return;
    try {
      if (Object.keys(next).length) {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      /* sans gravité */
    }
  }

  /**
   * Glisser la bordure entre deux colonnes transfère de la largeur de l'une à
   * l'autre : le total ne change pas, le tableau ne peut donc pas déborder.
   * Les largeurs sont enregistrées en pourcentage pour suivre la taille de
   * l'écran.
   */
  function startResize(event: React.MouseEvent<HTMLSpanElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const table = tableRef.current;
    const headers = table?.querySelectorAll<HTMLTableCellElement>("thead th");
    const current = headers?.[index];
    const next = headers?.[index + 1];
    if (!table || !current || !next) return;

    const tableWidth = table.getBoundingClientRect().width;
    const startX = event.clientX;
    const startCurrent = current.getBoundingClientRect().width;
    const startNext = next.getBoundingClientRect().width;
    const pair = startCurrent + startNext;
    const currentKey = columns[index].key;
    const nextKey = columns[index + 1].key;

    resizingRef.current = true;
    document.body.classList.add("is-resizing-columns");
    let latest = customWidths;

    function toPercent(px: number) {
      return `${((px / tableWidth) * 100).toFixed(2)}%`;
    }

    function onMove(moveEvent: MouseEvent) {
      const width = Math.min(
        pair - MIN_COLUMN_WIDTH,
        Math.max(MIN_COLUMN_WIDTH, startCurrent + moveEvent.clientX - startX),
      );
      latest = { ...latest, [currentKey]: toPercent(width), [nextKey]: toPercent(pair - width) };
      setCustomWidths(latest);
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("is-resizing-columns");
      saveWidths(latest);
      window.setTimeout(() => {
        resizingRef.current = false;
      }, 0);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function resetWidths() {
    setCustomWidths({});
    saveWidths({});
  }

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const column = columns.find((item) => item.key === sort.key);
    if (!column) return rows;

    const getValue = column.sortValue || ((row: T) => String(column.render(row) ?? ""));

    const sorted = [...rows].sort((left, right) => {
      const leftValue = getValue(left);
      const rightValue = getValue(right);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue - rightValue;
      }

      return String(leftValue).localeCompare(String(rightValue), "fr", { numeric: true });
    });

    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [columns, rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || resizingRef.current) return;

    setPage(0);
    setSort((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }

      return null;
    });
  }

  if (rows.length === 0) {
    return <p className="admin-empty-state">{emptyLabel}</p>;
  }

  return (
    <div className="admin-data-table-shell">
      <div className="admin-data-table-scroll">
        <table
          className={`admin-data-table${className ? ` ${className}` : ""}${resizeKey ? " admin-data-table-resizable" : ""}`}
          ref={tableRef}
        >
          <thead>
            <tr>
              {columns.map((column, index) => {
                const isSorted = sort?.key === column.key;
                const width = widthFor(column);
                return (
                  <th
                    key={column.key}
                    style={width ? { width } : undefined}
                    className={column.sortable ? "admin-data-table-sortable" : undefined}
                    onClick={() => handleSort(column)}
                  >
                    <span className="admin-data-table-th-content">
                      {column.headerRender ? column.headerRender() : column.label}
                      {column.sortable ? (
                        <span className={`admin-data-table-sort-icon${isSorted ? " is-active" : ""}`}>
                          {isSorted ? (sort?.direction === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      ) : null}
                    </span>
                    {/* Poignée sur la bordure droite, sauf pour la dernière colonne. */}
                    {resizeKey && index < columns.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="admin-col-resizer"
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => startResize(event, index)}
                        title="Glisser pour ajuster la largeur"
                      />
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const key = getRowKey(row);
              const active = isRowActive?.(row);
              const extraClassName = getRowClassName?.(row) || "";
              return (
                <tr
                  key={key}
                  className={`${onRowClick ? "admin-data-table-row-clickable" : ""}${active ? " admin-data-table-row-active" : ""}${extraClassName ? ` ${extraClassName}` : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => {
                    const width = widthFor(column);
                    return (
                      <td key={column.key} style={width ? { width } : undefined}>
                        {column.render(row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="admin-data-table-pagination">
          <button
            type="button"
            className="admin-copy-button"
            disabled={currentPage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Précédent
          </button>
          <span>
            Page {currentPage + 1} / {pageCount} · {sortedRows.length} résultat{sortedRows.length > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="admin-copy-button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          >
            Suivant
          </button>
        </div>
      ) : (
        <div className="admin-data-table-pagination admin-data-table-pagination-single">
          <span>{sortedRows.length} résultat{sortedRows.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {resizeKey && Object.keys(customWidths).length ? (
        <button className="admin-col-reset" onClick={resetWidths} type="button">
          Rétablir la largeur des colonnes
        </button>
      ) : null}
    </div>
  );
}
