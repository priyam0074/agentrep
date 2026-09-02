import type { ProviderConfig } from "@agentrep/provider-kit";
import { paise } from "@agentrep/webmcp";

const DATES = ["2026-09-12", "2026-09-19", "2026-09-26"];

export const config: ProviderConfig = {
  brand: "PartyHub",
  domain: "partyhub-webmcp.vercel.app",
  slot: "venue",
  noun: "venue",
  nounPlural: "venues",
  accent: "#2f5d50",
  tagline: "Party venues across Delhi NCR, bookable by capacity, theme and date.",
  bookVerb: "book",
  toolNames: {
    search: "search_venues",
    details: "get_venue_details",
    availability: "check_availability",
    price: "get_price",
    book: "book_venue",
  },
  filters: [
    {
      key: "maxBudgetInPaise",
      type: "number",
      description: "Highest acceptable venue price in paise (₹6,000 = 600000).",
      match: (i, v) => i.priceInPaise <= Number(v),
    },
    {
      key: "guests",
      type: "number",
      description: "Number of people attending. Filters to venues that fit them.",
      match: (i, v) => Number(i.attributes.capacity) >= Number(v),
    },
    {
      key: "theme",
      type: "string",
      description: "Party theme, e.g. \"Pokémon\", \"superhero\", \"unicorn\". Matched loosely against the venue's supported themes.",
      match: (i, v) =>
        i.tags.some((t) => t.toLowerCase().includes(String(v).toLowerCase())),
    },
    {
      key: "indoorOnly",
      type: "boolean",
      description: "Restrict to indoor venues. Useful in monsoon season.",
      match: (i, v) => (v ? i.attributes.indoor === true : true),
    },
  ],
  items: [
    {
      id: "venue-fun-arena",
      name: "Kids Fun Arena",
      priceInPaise: paise(7000),
      blurb: "Ball pit, slides and a dedicated party room. Staff run the games for you.",
      attributes: { capacity: 20, rating: 4.6, indoor: true, hours: 3 },
      tags: ["kids", "pokemon", "superhero", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-bounce-town",
      name: "Bounce Town",
      priceInPaise: paise(5500),
      blurb: "Trampoline park with a partitioned party corner. Loud, energetic, popular.",
      attributes: { capacity: 25, rating: 4.3, indoor: true, hours: 2 },
      tags: ["kids", "sports", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-terrace-club",
      name: "The Terrace Club",
      priceInPaise: paise(9500),
      blurb: "Rooftop lawn with shade sails. The nicest room on the list, and the priciest.",
      attributes: { capacity: 40, rating: 4.8, indoor: false, hours: 4 },
      tags: ["kids", "garden", "premium", "pokemon"],
      availableDates: ["2026-09-19", "2026-09-26"],
    },
    {
      id: "venue-little-explorers",
      name: "Little Explorers Hall",
      priceInPaise: paise(4200),
      blurb: "A plain hall with tables and a small play area. Cheap, clean, no frills.",
      attributes: { capacity: 15, rating: 4.1, indoor: true, hours: 3 },
      tags: ["kids", "budget", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-rainbow-cafe",
      name: "Rainbow Play Cafe",
      priceInPaise: paise(6000),
      blurb: "Cafe with a supervised play zone. Parents get decent coffee, which counts.",
      attributes: { capacity: 18, rating: 4.4, indoor: true, hours: 3 },
      tags: ["kids", "cafe", "unicorn", "indoor"],
      availableDates: DATES,
    },
  ],
};
