/** Presentation-only. Catalogue facts stay on `config.items` for the agent. */

export type Glyph = "bolt" | "compass" | "spark" | "orb";

/** One glyph per act, drawn from its own leading tag — not invented lore. */
export const ACT_GLYPH: Record<string, Glyph> = {
  "act-pikachu": "bolt",
  "act-trainer-games": "compass",
  "act-magic": "spark",
  "act-balloons": "orb",
};

export const ACT_IMAGE: Record<string, string> = {
  "act-pikachu": "/acts/act-pikachu.jpg",
  "act-trainer-games": "/acts/act-trainer.jpg",
  "act-magic": "/acts/act-magic.jpg",
  "act-balloons": "/acts/act-balloons.jpg",
};

export const GLYPH_PATH: Record<Glyph, string> = {
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5.5-5.5 2 2-5.5 5.5-2Z",
  spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z",
  orb: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 3a6 6 0 0 1 6 6h-6V6Z",
};

export const ATTR_LABELS: Record<string, string> = {
  durationMinutes: "Runtime",
  performers: "Crew",
  ageRange: "Ages",
};

export function attrValue(key: string, value: string | number | boolean) {
  if (key === "durationMinutes") return `${value} min`;
  if (key === "performers") return String(value) === "1" ? "1 performer" : `${value} performers`;
  return String(value);
}

export type SearchChip = "all" | "pokemon" | "magic" | "balloons" | "budget";

export const SEARCH_CHIPS: { id: SearchChip; label: string }[] = [
  { id: "all", label: "Every quest" },
  { id: "pokemon", label: "Pokémon" },
  { id: "magic", label: "Magic" },
  { id: "balloons", label: "Balloons" },
  { id: "budget", label: "Under ₹2,000" },
];

export function matchesChip(
  chip: SearchChip,
  item: { priceInPaise: number; tags: string[] },
) {
  if (chip === "all") return true;
  if (chip === "budget") return item.priceInPaise <= 200000;
  return item.tags.includes(chip);
}

export function matchesQuery(
  query: string,
  item: { name: string; blurb: string; tags: string[] },
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.name} ${item.blurb} ${item.tags.join(" ")}`.toLowerCase();
  return hay.includes(q);
}

/** Real signal, not invented rarity: fewer open dates is a fair "limited" cue. */
export function isLimited(availableDates: string[] | undefined) {
  return !!availableDates && availableDates.length <= 2;
}
