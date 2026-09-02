/** Presentation-only. Catalogue facts stay on `config.items` for the agent. */

export interface CakeVisual {
  image: string;
  epithet: string;
  finish: string;
}

export const CAKE_VISUALS: Record<string, CakeVisual> = {
  "cake-pokemon": {
    image: "/cakes/cake-pokemon.jpg",
    epithet: "Sculpted",
    finish: "Yellow buttercream, chocolate, a lightning on the side",
  },
  "cake-truffle": {
    image: "/cakes/cake-truffle.jpg",
    epithet: "Ganache",
    finish: "Dark chocolate, name plaque, nothing else",
  },
  "cake-rainbow": {
    image: "/cakes/cake-rainbow.jpg",
    epithet: "Layered",
    finish: "Six coloured sponges under vanilla buttercream",
  },
  "cake-vanilla": {
    image: "/cakes/cake-vanilla.jpg",
    epithet: "Quiet",
    finish: "Eggless vanilla, gold leaf, the smallest cake on the counter",
  },
  "cake-photo": {
    image: "/cakes/cake-photo.jpg",
    epithet: "Printed",
    finish: "Butterscotch sponge, edible photograph on top",
  },
  "cake-blackforest": {
    image: "/cakes/cake-blackforest.jpg",
    epithet: "Classic",
    finish: "Chocolate, cream, kirsch cherries",
  },
  "cake-redvelvet": {
    image: "/cakes/cake-redvelvet.jpg",
    epithet: "Crumb",
    finish: "Eggless red velvet, cream-cheese frosting",
  },
  "cake-mango": {
    image: "/cakes/cake-mango.jpg",
    epithet: "Season",
    finish: "Alphonso cream, fresh mango",
  },
  "cake-rasmalai": {
    image: "/cakes/cake-rasmalai.jpg",
    epithet: "Maison",
    finish: "Milk sponge, pistachio, saffron",
  },
  "cake-unicorn": {
    image: "/cakes/cake-unicorn.jpg",
    epithet: "Pastel",
    finish: "Vanilla sponge, gold horn, pearl sprinkles",
  },
  "cake-pistachio": {
    image: "/cakes/cake-pistachio.jpg",
    epithet: "Nut",
    finish: "Pistachio sponge, rose cream, dried petals",
  },
  "cake-freshfruit": {
    image: "/cakes/cake-freshfruit.jpg",
    epithet: "Garden",
    finish: "White cream, strawberries, kiwi, berries",
  },
  "cake-drip": {
    image: "/cakes/cake-drip.jpg",
    epithet: "Drip",
    finish: "White frosting, dark ganache, hazelnuts",
  },
  "cake-fondant": {
    image: "/cakes/cake-fondant.jpg",
    epithet: "Tiered",
    finish: "Ivory fondant, gold piping, thirty slices",
  },
  "cake-cookies": {
    image: "/cakes/cake-cookies.jpg",
    epithet: "Crumb",
    finish: "Cookies in the cream, budget and gone first",
  },
  "cake-strawberry": {
    image: "/cakes/cake-strawberry.jpg",
    epithet: "Berry",
    finish: "Sponge, cream, sliced strawberries",
  },
};

export const DEFAULT_VISUAL: CakeVisual = CAKE_VISUALS["cake-rasmalai"];

export function visualFor(id: string | null): CakeVisual {
  if (id && CAKE_VISUALS[id]) return CAKE_VISUALS[id];
  return DEFAULT_VISUAL;
}

export const ATTR_LABELS: Record<string, string> = {
  servings: "Serves",
  flavour: "Flavour",
  eggless: "Eggless",
  tiers: "Tiers",
};

export type SearchChip = "all" | "chocolate" | "vanilla" | "eggless" | "kids" | "budget";

export const SEARCH_CHIPS: { id: SearchChip; label: string }[] = [
  { id: "all", label: "All cakes" },
  { id: "chocolate", label: "Chocolate" },
  { id: "vanilla", label: "Vanilla" },
  { id: "eggless", label: "Eggless" },
  { id: "kids", label: "Kids" },
  { id: "budget", label: "Under ₹1,500" },
];

export function matchesChip(
  chip: SearchChip,
  item: { priceInPaise: number; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  if (chip === "all") return true;
  if (chip === "chocolate") return String(item.attributes.flavour).toLowerCase().includes("chocolate") || item.tags.includes("chocolate");
  if (chip === "vanilla") return String(item.attributes.flavour).toLowerCase().includes("vanilla");
  if (chip === "eggless") return item.attributes.eggless === true;
  if (chip === "kids") return item.tags.includes("kids") || item.tags.includes("themed");
  if (chip === "budget") return item.priceInPaise <= 150000;
  return true;
}

export function matchesQuery(
  query: string,
  item: { name: string; blurb: string; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.name} ${item.blurb} ${item.tags.join(" ")} ${item.attributes.flavour}`.toLowerCase();
  return hay.includes(q);
}
