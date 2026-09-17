"use client";

import { useMemo, useState } from "react";

export type DataTableColumn<T> = {
  key: string;
  label: string;
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
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);

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
    if (!column.sortable) return;

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
        <table className="admin-data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const isSorted = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={column.sortable ? "admin-data-table-sortable" : undefined}
                    onClick={() => handleSort(column)}
                  >
                    <span className="admin-data-table-th-content">
                      {column.label}
                      {column.sortable ? (
                        <span className={`admin-data-table-sort-icon${isSorted ? " is-active" : ""}`}>
                          {isSorted ? (sort?.direction === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const key = getRowKey(row);
              const active = isRowActive?.(row);
              return (
                <tr
                  key={key}
                  className={`${onRowClick ? "admin-data-table-row-clickable" : ""}${active ? " admin-data-table-row-active" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} style={column.width ? { width: column.width } : undefined}>
                      {column.render(row)}
                    </td>
                  ))}
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
    </div>
  );
}
