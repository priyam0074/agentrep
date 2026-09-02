import type { ProviderConfig } from "@agentrep/provider-kit";
import { paise } from "@agentrep/webmcp";

const DATES = ["2026-09-12", "2026-09-19", "2026-09-26"];
const LATER = ["2026-09-19", "2026-09-26"];

const textMatch = (item: {
  name: string;
  blurb: string;
  tags: string[];
  attributes: Record<string, string | number | boolean>;
}, q: string) => {
  const hay = `${item.name} ${item.blurb} ${item.tags.join(" ")} ${item.attributes.locality}`.toLowerCase();
  return hay.includes(q.toLowerCase());
};

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
      key: "query",
      type: "string",
      description: "Free-text search across venue name, locality, tags and description. e.g. \"trampoline\", \"Saket\", \"Pokémon\".",
      match: (i, v) => textMatch(i, String(v)),
    },
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
      key: "locality",
      type: "string",
      description: "Neighbourhood, e.g. \"Gurugram\", \"Noida\", \"Saket\".",
      match: (i, v) =>
        String(i.attributes.locality).toLowerCase().includes(String(v).toLowerCase()),
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
      attributes: { capacity: 20, rating: 4.6, indoor: true, hours: 3, locality: "Gurugram" },
      tags: ["kids", "pokemon", "superhero", "indoor", "play"],
      availableDates: DATES,
    },
    {
      id: "venue-bounce-town",
      name: "Bounce Town",
      priceInPaise: paise(5500),
      blurb: "Trampoline park with a partitioned party corner. Loud, energetic, popular.",
      attributes: { capacity: 25, rating: 4.3, indoor: true, hours: 2, locality: "Noida" },
      tags: ["kids", "sports", "indoor", "play"],
      availableDates: DATES,
    },
    {
      id: "venue-terrace-club",
      name: "The Terrace Club",
      priceInPaise: paise(9500),
      blurb: "Rooftop lawn with shade sails. The nicest room on the list, and the priciest.",
      attributes: { capacity: 40, rating: 4.8, indoor: false, hours: 4, locality: "Greater Kailash" },
      tags: ["kids", "garden", "premium", "pokemon"],
      availableDates: LATER,
    },
    {
      id: "venue-little-explorers",
      name: "Little Explorers Hall",
      priceInPaise: paise(4200),
      blurb: "A plain hall with tables and a small play area. Cheap, clean, no frills.",
      attributes: { capacity: 15, rating: 4.1, indoor: true, hours: 3, locality: "Dwarka" },
      tags: ["kids", "budget", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-rainbow-cafe",
      name: "Rainbow Play Cafe",
      priceInPaise: paise(6000),
      blurb: "Cafe with a supervised play zone. Parents get decent coffee, which counts.",
      attributes: { capacity: 18, rating: 4.4, indoor: true, hours: 3, locality: "Saket" },
      tags: ["kids", "cafe", "unicorn", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-pixel-den",
      name: "Pixel Den Arcade",
      priceInPaise: paise(8000),
      blurb: "Indoor arcade and a birthday booth. Works for a Pokémon theme without hiring décor.",
      attributes: { capacity: 22, rating: 4.5, indoor: true, hours: 3, locality: "Gurugram" },
      tags: ["kids", "pokemon", "indoor", "play"],
      availableDates: DATES,
    },
    {
      id: "venue-farm-barn",
      name: "Chattarpur Barn",
      priceInPaise: paise(7200),
      blurb: "Farmhouse lawn, a shamiana if you want shade. Dusty shoes, good photographs.",
      attributes: { capacity: 35, rating: 4.4, indoor: false, hours: 4, locality: "Chattarpur" },
      tags: ["kids", "garden", "outdoor"],
      availableDates: DATES,
    },
    {
      id: "venue-splash-house",
      name: "Splash House",
      priceInPaise: paise(8800),
      blurb: "Private indoor pool and a cabana. Towels included. Not for toddlers who can't swim.",
      attributes: { capacity: 16, rating: 4.7, indoor: true, hours: 3, locality: "Vasant Kunj" },
      tags: ["kids", "indoor", "premium"],
      availableDates: DATES,
    },
    {
      id: "venue-loft-gurgaon",
      name: "The Loft, Cyber City",
      priceInPaise: paise(6500),
      blurb: "Brick loft, long table, high windows. Feels grown-up; the kids still run.",
      attributes: { capacity: 24, rating: 4.5, indoor: true, hours: 4, locality: "Gurugram" },
      tags: ["kids", "indoor", "premium"],
      availableDates: DATES,
    },
    {
      id: "venue-soft-play",
      name: "Little Soft Play",
      priceInPaise: paise(3800),
      blurb: "Foam shapes and a ball pool. Built for the under-fives. Parents sit on the floor.",
      attributes: { capacity: 12, rating: 4.2, indoor: true, hours: 2, locality: "Rohini" },
      tags: ["kids", "indoor", "budget", "play"],
      availableDates: DATES,
    },
    {
      id: "venue-mini-cinema",
      name: "Mini Cinema Hire",
      priceInPaise: paise(7500),
      blurb: "A twelve-seat screen, popcorn, the film of your choosing. Then cake in the lobby.",
      attributes: { capacity: 12, rating: 4.6, indoor: true, hours: 3, locality: "Hauz Khas" },
      tags: ["kids", "indoor", "premium"],
      availableDates: DATES,
    },
    {
      id: "venue-art-studio",
      name: "Colour Lab Studio",
      priceInPaise: paise(4800),
      blurb: "Aprons, long tables, paint that will come off the floor. The party is the making.",
      attributes: { capacity: 16, rating: 4.3, indoor: true, hours: 3, locality: "Defence Colony" },
      tags: ["kids", "indoor", "unicorn"],
      availableDates: DATES,
    },
    {
      id: "venue-noida-lawn",
      name: "Sector 50 Club Lawn",
      priceInPaise: paise(8200),
      blurb: "Club grass, a small stage, bougainvillea. Evening slots book first.",
      attributes: { capacity: 40, rating: 4.5, indoor: false, hours: 4, locality: "Noida" },
      tags: ["kids", "garden", "outdoor", "premium"],
      availableDates: LATER,
    },
    {
      id: "venue-laser-tag",
      name: "Greenlight Arena",
      priceInPaise: paise(9000),
      blurb: "Laser tag plus a sofa corner for the cake. Superhero themes land here naturally.",
      attributes: { capacity: 20, rating: 4.4, indoor: true, hours: 2, locality: "Noida" },
      tags: ["kids", "sports", "superhero", "indoor", "play"],
      availableDates: DATES,
    },
    {
      id: "venue-community-hall",
      name: "RWA Hall, Janakpuri",
      priceInPaise: paise(3500),
      blurb: "Ceiling fans, plastic chairs, a backdrop. The cheapest booking that still has a kitchen.",
      attributes: { capacity: 30, rating: 3.9, indoor: true, hours: 4, locality: "Janakpuri" },
      tags: ["kids", "budget", "indoor"],
      availableDates: DATES,
    },
    {
      id: "venue-treehouse",
      name: "The Treehouse Garden",
      priceInPaise: paise(7800),
      blurb: "Wooden deck around a tree, lanterns, picnic rugs. Pokémon hunts work outdoors.",
      attributes: { capacity: 22, rating: 4.7, indoor: false, hours: 3, locality: "Chattarpur" },
      tags: ["kids", "garden", "outdoor", "pokemon"],
      availableDates: DATES,
    },
  ],
};
