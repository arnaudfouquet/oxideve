import options from "../../shared/feedback-options.json";

/**
 * Listes proposées dans le formulaire de retours, lues depuis le fichier
 * partagé avec le backend : celui-ci refuse toute page absente de la liste,
 * les deux cotés ne peuvent donc pas diverger.
 */
export const FEEDBACK_PAGES: string[] = options.pages;

export const FEEDBACK_KINDS: string[] = options.kinds;

export const FEEDBACK_STATUSES: string[] = options.statuses;
