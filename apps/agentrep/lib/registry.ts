/**
 * Capability discovery.
 *
 * The PRD is explicit that we should not build a global registry, so this
 * sits behind an adapter interface. Today it reads a local catalogue; a
 * real deployment would point the same interface at a public WebMCP
 * registry. Nothing above this file knows which it is.
 */

import type { SlotId } from "./types";

export interface ProviderRecord {
  name: string;
  domain: string;
  url: string;
  embedUrl: string;
  slot: SlotId;
  capability: string;
  summary: string;
  tools: string[];
  keywords: string[];
  /** False until the site has been indexed. See unlockLateProvider(). */
  indexed: boolean;
}

const origin = (envKey: string, fallback: string) =>
  (process.env[envKey] as string | undefined) || fallback;

/**
 * Swap these four constants for the real Vercel URLs after deploying.
 * They are the only place deployment URLs appear in the codebase.
 */
export const PROVIDER_ORIGINS = {
  partyhub: origin("NEXT_PUBLIC_PARTYHUB_URL", "http://localhost:3001"),
  cakehub: origin("NEXT_PUBLIC_CAKEHUB_URL", "http://localhost:3002"),
  foodhub: origin("NEXT_PUBLIC_FOODHUB_URL", "http://localhost:3003"),
  pokemonpartyhub: origin("NEXT_PUBLIC_POKEMONPARTYHUB_URL", "http://localhost:3004"),
};

const CATALOGUE: ProviderRecord[] = [
  {
    name: "PartyHub",
    domain: "partyhub-webmcp.vercel.app",
    url: PROVIDER_ORIGINS.partyhub,
    embedUrl: `${PROVIDER_ORIGINS.partyhub}/embed`,
    slot: "venue",
    capability: "Venue booking",
    summary: "Party venues in Delhi NCR, searchable by capacity, theme, date and budget.",
    tools: ["search_venues", "get_venue_details", "check_availability", "get_price", "book_venue"],
    keywords: ["venue", "hall", "place", "location", "party", "birthday", "space", "book"],
    indexed: true,
  },
  {
    name: "FoodHub",
    domain: "foodhub-webmcp.vercel.app",
    url: PROVIDER_ORIGINS.foodhub,
    embedUrl: `${PROVIDER_ORIGINS.foodhub}/embed`,
    slot: "food",
    capability: "Catering",
    summary: "Per-head catering packages for children's parties, with extra-guest pricing.",
    tools: ["search_packages", "get_package_details", "check_availability", "get_price", "place_order"],
    keywords: ["food", "catering", "meal", "lunch", "snacks", "pizza", "eat", "menu"],
    indexed: true,
  },
  {
    name: "CakeHub",
    domain: "cakehub-webmcp.vercel.app",
    url: PROVIDER_ORIGINS.cakehub,
    embedUrl: `${PROVIDER_ORIGINS.cakehub}/embed`,
    slot: "cake",
    capability: "Cake ordering",
    summary: "Celebration cakes by servings, flavour, theme and delivery date.",
    tools: ["search_cakes", "get_cake_details", "check_delivery", "get_price", "order_cake"],
    keywords: ["cake", "dessert", "bakery", "birthday", "sweet", "eggless"],
    indexed: true,
  },
  {
    name: "PokemonPartyHub",
    domain: "pokemonpartyhub-webmcp.vercel.app",
    url: PROVIDER_ORIGINS.pokemonpartyhub,
    embedUrl: `${PROVIDER_ORIGINS.pokemonpartyhub}/embed`,
    slot: "entertainment",
    capability: "Themed entertainment",
    summary: "Costumed entertainers, hosted games and shows for themed children's parties.",
    tools: ["search_pokemon_entertainment", "get_act_details", "check_availability", "get_price", "book_entertainment"],
    keywords: ["entertainment", "entertainer", "pokemon", "pikachu", "magic", "games", "show", "balloon", "host"],
    indexed: false, // published after the demo begins
  },
];

let catalogue = CATALOGUE.map((p) => ({ ...p }));

/**
 * The demo's "new capability appears on the web" beat. This does not
 * invent a capability — PokemonPartyHub is a real running site with real
 * tools. It only simulates the moment a registry finishes indexing it,
 * which is why the control that calls this is labelled as a simulation.
 */
export function indexLateProvider(): ProviderRecord | null {
  const late = catalogue.find((p) => !p.indexed);
  if (!late) return null;
  late.indexed = true;
  return late;
}

export function allIndexed(): ProviderRecord[] {
  return catalogue.filter((p) => p.indexed);
}

function score(provider: ProviderRecord, terms: string[]): number {
  let s = 0;
  for (const t of terms) {
    if (provider.keywords.some((k) => k === t)) s += 3;
    else if (provider.keywords.some((k) => k.includes(t) || t.includes(k))) s += 2;
    if (provider.capability.toLowerCase().includes(t)) s += 2;
    if (provider.summary.toLowerCase().includes(t)) s += 1;
  }
  return s;
}

export interface DiscoveryHit extends ProviderRecord { relevance: number; }

/**
 * Match a free-text goal against indexed providers. Deliberately blunt —
 * keyword overlap, no embeddings. The reasoning belongs to the agent;
 * this layer only answers "who can do this".
 */
export function discover(query: string, limit = 8): DiscoveryHit[] {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  return allIndexed()
    .map((p) => ({ ...p, relevance: score(p, terms) }))
    .filter((p) => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export function getProvider(domainOrName: string): ProviderRecord | undefined {
  const q = domainOrName.toLowerCase();
  return allIndexed().find(
    (p) => p.domain.toLowerCase() === q || p.name.toLowerCase() === q,
  );
}
