import type { ProviderConfig } from "@agentrep/provider-kit";
import { paise } from "@agentrep/webmcp";

/**
 * The late arrival. This site does not exist in the registry at the
 * start of the demo — it is added mid-conversation to show that a new
 * capability appearing on the web becomes usable with no change to the
 * agent and no change to AgentRep's planner.
 */
export const config: ProviderConfig = {
  brand: "PokemonPartyHub",
  domain: "pokemonpartyhub-webmcp.vercel.app",
  slot: "entertainment",
  noun: "act",
  nounPlural: "acts",
  accent: "#2d4b8f",
  tagline: "Costumed entertainers, hosted games and shows for themed children's parties.",
  bookVerb: "book",
  toolNames: {
    search: "search_pokemon_entertainment",
    details: "get_act_details",
    availability: "check_availability",
    price: "get_price",
    book: "book_entertainment",
  },
  filters: [
    {
      key: "maxBudgetInPaise",
      type: "number",
      description: "Highest acceptable fee in paise.",
      match: (i, v) => i.priceInPaise <= Number(v),
    },
    {
      key: "theme",
      type: "string",
      description: "Character or theme, e.g. \"Pokémon\", \"Pikachu\", \"magic\".",
      match: (i, v) =>
        i.tags.some((t) => t.toLowerCase().includes(String(v).toLowerCase())),
    },
    {
      key: "minDurationMinutes",
      type: "number",
      description: "Shortest acceptable performance length in minutes.",
      match: (i, v) => Number(i.attributes.durationMinutes) >= Number(v),
    },
  ],
  items: [
    {
      id: "act-pikachu",
      name: "Pikachu Meet & Greet",
      priceInPaise: paise(3200),
      blurb: "Costumed Pikachu for photos, a short dance and the cake cutting.",
      attributes: { durationMinutes: 120, performers: 1, ageRange: "3-10" },
      tags: ["pokemon", "pikachu", "costume"],
      availableDates: ["2026-09-12", "2026-09-19", "2026-09-26"],
    },
    {
      id: "act-trainer-games",
      name: "Pokémon Trainer Games",
      priceInPaise: paise(2400),
      blurb: "A host runs badge-hunt and catching games with props for up to 20 kids.",
      attributes: { durationMinutes: 90, performers: 1, ageRange: "5-12" },
      tags: ["pokemon", "games", "host"],
      availableDates: ["2026-09-12", "2026-09-19", "2026-09-26"],
    },
    {
      id: "act-magic",
      name: "Close-up Magic Show",
      priceInPaise: paise(2800),
      blurb: "Forty minutes of card and rope tricks, then balloon animals.",
      attributes: { durationMinutes: 60, performers: 1, ageRange: "4-12" },
      tags: ["magic", "show"],
      availableDates: ["2026-09-19", "2026-09-26"],
    },
    {
      id: "act-balloons",
      name: "Balloon Artist",
      priceInPaise: paise(1500),
      blurb: "One artist making shapes on request, including Pokémon, for an hour.",
      attributes: { durationMinutes: 60, performers: 1, ageRange: "3-12" },
      tags: ["balloons", "pokemon", "craft"],
      availableDates: ["2026-09-12", "2026-09-19", "2026-09-26"],
    },
  ],
};
