/**
 * City ↔ neighbourhood map for venue candidates on the board.
 * Mirrors PartyHub: Delhi is Delhi; Noida and Gurugram are not Delhi.
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

export function sameCity(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left && !right) return true;
  if (!left || !right) return false;
  const cityA = resolveCity(left) ?? (isNcrQuery(left) ? "ncr" : normalizePlaceQuery(left));
  const cityB = resolveCity(right) ?? (isNcrQuery(right) ? "ncr" : normalizePlaceQuery(right));
  return cityA === cityB;
}

/** True only when a candidate declares a locality that is not in `city`. */
export function candidateConflictsWithCity(
  attributes: Record<string, string | number | boolean> | undefined,
  city: string | null | undefined,
): boolean {
  if (!city?.trim()) return false;
  const loc = attributes?.locality;
  if (loc == null || String(loc).trim() === "") return false;
  return !localityFitsQuery(String(loc), city);
}
