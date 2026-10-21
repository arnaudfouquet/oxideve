import type { Session } from "../../../shared/types";

/**
 * Formatage et comparaison de dates pour l'espace d'administration.
 * Regroupes ici pour que les panneaux puissent les partager sans dependre
 * du composant principal.
 */

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatDateLabel(value?: string) {
  if (!value) {
    return "Non planifiée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatShortDateFr(value?: string | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRegistrationDate(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

/**
 * Nombre de jours depuis la réception d'une demande encore à qualifier.
 * Renvoie null dès que la demande a été traitée : l'ancienneté n'a alors plus
 * d'intérêt.
 */
export function waitingDays(row: { status: string; firstContactAt: string }) {
  if (row.status !== "Pré-inscription (à qualifier)") return null;

  const reception = new Date(row.firstContactAt);
  if (Number.isNaN(reception.getTime())) return null;

  const jour = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((Date.now() - reception.getTime()) / jour));
}

/** Au-delà de 2 jours la demande est en retard, au-delà de 5 elle est urgente. */
export function waitingTone(days: number) {
  if (days >= 5) return "urgent";
  if (days >= 2) return "late";
  return "fresh";
}

export function formatShortDateTimeFr(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} - ${get("hour")}h${get("minute")}`;
}

export function formatSessionRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "Session à planifier";
  }

  return `${formatDateLabel(startDate)} au ${formatDateLabel(endDate)}`;
}

export function compareDateDesc(left?: string, right?: string) {
  return (right || "").localeCompare(left || "");
}

export function isUpcoming(session?: Session) {
  if (!session) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return session.endDate >= today;
}

export function getSessionState(session: Session) {
  if (isUpcoming(session)) {
    return "À venir";
  }

  return "Passée";
}
