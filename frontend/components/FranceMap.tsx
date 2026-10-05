"use client";

import { useRef, useState } from "react";
import departments from "./france-departments.json";

type Department = { code: string; nom: string; d: string };

const DEPARTMENTS = departments as Department[];

// Accroches reprises de la carte d'intervention (clin d'œil terrain).
const ACCROCHES = ["On est là", "On intervient ici", "Zone couverte", "Présents sur ce secteur", "Ici aussi, c'est nous"];

export function FranceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  function handleEnter(event: React.MouseEvent<SVGPathElement>, dept: Department, index: number) {
    const map = mapRef.current;
    if (!map) return;
    const mapRect = map.getBoundingClientRect();
    const deptRect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text: `${dept.nom} — ${ACCROCHES[index % ACCROCHES.length]}`,
      x: deptRect.left + deptRect.width / 2 - mapRect.left,
      y: deptRect.top - mapRect.top,
    });
  }

  return (
    <div className="france-map" ref={mapRef}>
      <svg
        viewBox="0 0 730 692"
        xmlns="http://www.w3.org/2000/svg"
        className="france-map-svg"
        role="img"
        aria-label="Carte des zones d'intervention Oxideve, partout en France"
      >
        <g>
          {DEPARTMENTS.map((dept, index) => (
            <path
              className="france-dept"
              d={dept.d}
              key={dept.code}
              onMouseEnter={(event) => handleEnter(event, dept, index)}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </g>
      </svg>
      <div
        className={`france-map-tooltip${tooltip ? " is-visible" : ""}`}
        style={tooltip ? { left: tooltip.x, top: tooltip.y } : undefined}
        dangerouslySetInnerHTML={tooltip ? { __html: tooltip.text.replace(/—\s(.+)$/, "— <strong>$1</strong>") } : undefined}
      />
    </div>
  );
}
