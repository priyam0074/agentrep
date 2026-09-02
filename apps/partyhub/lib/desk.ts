/** Presentation-only. Catalogue facts stay on `config.items` for the agent. */

export interface VenueVisual {
  image: string;
  epithet: string;
  finish: string;
}

export const VENUE_VISUALS: Record<string, VenueVisual> = {
  "venue-fun-arena": {
    image: "/venues/venue-fun-arena.jpg",
    epithet: "Play",
    finish: "Ball pit, slides, staff-run games · Gurugram",
  },
  "venue-bounce-town": {
    image: "/venues/venue-bounce-town.jpg",
    epithet: "Bounce",
    finish: "Trampolines and a partitioned party corner · Noida",
  },
  "venue-terrace-club": {
    image: "/venues/venue-terrace-club.jpg",
    epithet: "Roof",
    finish: "Lawn, shade sails, the nicest room · Greater Kailash",
  },
  "venue-little-explorers": {
    image: "/venues/venue-little-explorers.jpg",
    epithet: "Hall",
    finish: "Tables, a small play corner, no frills · Dwarka",
  },
  "venue-rainbow-cafe": {
    image: "/venues/venue-rainbow-cafe.jpg",
    epithet: "Cafe",
    finish: "Supervised play, coffee for the adults · Saket",
  },
  "venue-pixel-den": {
    image: "/venues/venue-pixel-den.jpg",
    epithet: "Arcade",
    finish: "Cabinets, a birthday booth, indoor · Gurugram",
  },
  "venue-farm-barn": {
    image: "/venues/venue-farm-barn.jpg",
    epithet: "Lawn",
    finish: "Farmhouse grass and a shamiana · Chattarpur",
  },
  "venue-splash-house": {
    image: "/venues/venue-splash-house.jpg",
    epithet: "Pool",
    finish: "Private indoor pool and cabana · Vasant Kunj",
  },
  "venue-loft-gurgaon": {
    image: "/venues/venue-loft.jpg",
    epithet: "Loft",
    finish: "Brick, high windows, a long table · Gurugram",
  },
  "venue-soft-play": {
    image: "/venues/venue-soft-play.jpg",
    epithet: "Soft",
    finish: "Foam and a ball pool for the under-fives · Rohini",
  },
  "venue-mini-cinema": {
    image: "/venues/venue-cinema.jpg",
    epithet: "Screen",
    finish: "Twelve seats, popcorn, then cake · Hauz Khas",
  },
  "venue-art-studio": {
    image: "/venues/venue-art-studio.jpg",
    epithet: "Make",
    finish: "Aprons, paint, long tables · Defence Colony",
  },
  "venue-noida-lawn": {
    image: "/venues/venue-noida-lawn.jpg",
    epithet: "Club",
    finish: "Grass, a stage, evening light · Noida",
  },
  "venue-laser-tag": {
    image: "/venues/venue-laser-tag.jpg",
    epithet: "Arena",
    finish: "Laser tag and a sofa for the cake · Noida",
  },
  "venue-community-hall": {
    image: "/venues/venue-community-hall.jpg",
    epithet: "RWA",
    finish: "Fans, chairs, a kitchen · Janakpuri",
  },
  "venue-treehouse": {
    image: "/venues/venue-treehouse.jpg",
    epithet: "Garden",
    finish: "Deck around a tree, lanterns · Chattarpur",
  },
};

export const DEFAULT_VISUAL: VenueVisual = VENUE_VISUALS["venue-fun-arena"];

export function visualFor(id: string | null): VenueVisual {
  if (id && VENUE_VISUALS[id]) return VENUE_VISUALS[id];
  return DEFAULT_VISUAL;
}

export const ATTR_LABELS: Record<string, string> = {
  capacity: "Holds",
  rating: "Rating",
  indoor: "Setting",
  hours: "Hours",
  locality: "Area",
};

export type SearchChip = "all" | "indoor" | "outdoor" | "play" | "budget" | "premium";

export const SEARCH_CHIPS: { id: SearchChip; label: string }[] = [
  { id: "all", label: "All venues" },
  { id: "indoor", label: "Indoor" },
  { id: "outdoor", label: "Outdoor" },
  { id: "play", label: "Play spaces" },
  { id: "budget", label: "Under ₹6,000" },
  { id: "premium", label: "Premium" },
];

export function matchesChip(
  chip: SearchChip,
  item: { priceInPaise: number; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  if (chip === "all") return true;
  if (chip === "indoor") return item.attributes.indoor === true;
  if (chip === "outdoor") return item.attributes.indoor === false;
  if (chip === "play") return item.tags.includes("play");
  if (chip === "budget") return item.priceInPaise <= 600000;
  if (chip === "premium") return item.tags.includes("premium") || item.priceInPaise >= 800000;
  return true;
}

export function matchesQuery(
  query: string,
  item: { name: string; blurb: string; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.name} ${item.blurb} ${item.tags.join(" ")} ${item.attributes.locality}`.toLowerCase();
  return hay.includes(q);
}
