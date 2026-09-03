/**
 * City ↔ neighbourhood map for the PartyHub catalogue.
 * Delhi is Delhi; Noida and Gurugram are separate cities, not aliases.
 */

const CITY_LOCALITIES: Record<string, readonly string[]> = {
  delhi: [
    "greater kailash",
    "dwarka",
    "saket",
    "chattarpur",
    "vasant kunj",
    "rohini",
    "hauz khas",
    "defence colony",
    "janakpuri",
  ],
  noida: ["noida"],
  gurugram: ["gurugram"],
};

const CITY_ALIASES: Record<string, string> = {
  delhi: "delhi",
  "new delhi": "delhi",
  noida: "noida",
  gurugram: "gurugram",
  gurgaon: "gurugram",
};

export function normalizePlaceQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isNcrQuery(raw: string): boolean {
  const q = normalizePlaceQuery(raw);
  return q === "ncr" || q === "delhi ncr" || q === "ncr delhi";
}

export function resolveCity(raw: string): string | null {
  return CITY_ALIASES[normalizePlaceQuery(raw)] ?? null;
}

/** True when a venue locality belongs to a city or neighbourhood query. */
export function localityFitsQuery(
  locality: string | null | undefined,
  query: string,
): boolean {
  const q = normalizePlaceQuery(query);
  if (!q) return true;
  if (isNcrQuery(q)) return true;

  const loc = String(locality ?? "").trim().toLowerCase();
  if (!loc) return false;

  const city = resolveCity(q);
  if (city) return CITY_LOCALITIES[city].includes(loc);

  return loc.includes(q) || q.includes(loc);
}
