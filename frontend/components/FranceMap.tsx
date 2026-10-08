"use client";

import { useRef, useState } from "react";
import departments from "./france-departments.json";

type Department = { code: string; nom: string; d: string };

const DEPARTMENTS = departments as Department[];

// Départements couverts (sud de la France).
const ACTIVE_CODES = [
  "01", "07", "09", "11", "12", "26", "30", "31", "32", "34", "38", "42", "43", "46", "48", "66", "69", "73", "74", "81", "82",
];

const ACTIVE_SET = new Set(ACTIVE_CODES);
const ACTIVE_LIST = ACTIVE_CODES.map((code) => DEPARTMENTS.find((dept) => dept.code === code)).filter(
  (dept): dept is Department => Boolean(dept),
);

const ACCROCHES = ["On est là", "On intervient ici", "Zone couverte", "Présents sur ce secteur", "Ici aussi, c'est nous"];

export function FranceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ nom: string; accroche: string; x: number; y: number } | null>(null);

  function handleEnter(event: React.MouseEvent<SVGPathElement>, dept: Department, index: number) {
    const map = mapRef.current;
    if (!map) return;
    const mapRect = map.getBoundingClientRect();
    const deptRect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      nom: dept.nom,
      accroche: ACCROCHES[index % ACCROCHES.length],
      x: deptRect.left + deptRect.width / 2 - mapRect.left,
      y: deptRect.top - mapRect.top,
    });
  }

  return (
    <div className="france-map-layout">
      <div className="france-map" ref={mapRef}>
        <svg
          viewBox="261.8 354.4 408.1 333"
          xmlns="http://www.w3.org/2000/svg"
          className="france-map-svg"
          role="img"
          aria-label="Carte des zones d'intervention Oxideve dans le sud de la France"
        >
          <g>
            {DEPARTMENTS.map((dept, index) => {
              const active = ACTIVE_SET.has(dept.code);
              return (
                <path
                  className={`france-dept${active ? " is-active" : ""}`}
                  d={dept.d}
                  key={dept.code}
                  onMouseEnter={active ? (event) => handleEnter(event, dept, index) : undefined}
                  onMouseLeave={active ? () => setTooltip(null) : undefined}
                />
              );
            })}
          </g>
        </svg>
        <div
          className={`france-map-tooltip${tooltip ? " is-visible" : ""}`}
          style={tooltip ? { left: tooltip.x, top: tooltip.y } : undefined}
        >
          {tooltip ? (
            <>
              {tooltip.nom} — <strong>{tooltip.accroche}</strong>
            </>
          ) : null}
        </div>
      </div>

      <div className="france-map-panel">
        <p className="france-map-panel-title">Nos zones d&apos;intervention</p>
        <ul className="france-map-list">
          {ACTIVE_LIST.map((dept) => (
            <li key={dept.code}>
              <span className="france-map-code">{dept.code}</span>
              <span>{dept.nom}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
