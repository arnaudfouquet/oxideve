/**
 * "17 novembre 2026" pour une journée, "23 au 24 mars 2027" dans le même mois,
 * "28 octobre au 2 novembre 2026" à cheval sur deux mois. Répéter la date
 * entière deux fois pour une session d'un jour était illisible.
 */
export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const full = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (startDate === endDate) {
    return full.format(start);
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()} au ${full.format(end)}`;
  }

  const withoutYear = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
  const sameYear = start.getFullYear() === end.getFullYear();

  return `${sameYear ? withoutYear.format(start) : full.format(start)} au ${full.format(end)}`;
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}
