/** Presentation-only. Catalogue facts stay on `config.items` for the agent. */

export interface MenuVisual {
  image: string;
  epithet: string;
  credit?: { name: string; license: string; url: string };
}

export const MENU_VISUALS: Record<string, MenuVisual> = {
  "food-kids-party": {
    image: "/food/food-kids-party.jpg",
    epithet: "Wood-fired",
  },
  "food-mini-feast": {
    image: "/food/food-mini-feast.jpg",
    epithet: "Light",
  },
  "food-deluxe": {
    image: "/food/food-deluxe.jpg",
    epithet: "Live counter",
    credit: { name: "PattayaPatrol", license: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0" },
  },
  "food-snack-boxes": {
    image: "/food/food-snack-boxes.jpg",
    epithet: "Packed",
    credit: { name: "Ella Olsson", license: "CC BY 2.0", url: "https://creativecommons.org/licenses/by/2.0" },
  },
};

export const DEFAULT_VISUAL = MENU_VISUALS["food-deluxe"];

export function visualFor(id: string | null): MenuVisual {
  if (id && MENU_VISUALS[id]) return MENU_VISUALS[id];
  return DEFAULT_VISUAL;
}

export const ATTR_LABELS: Record<string, string> = {
  includedGuests: "Feeds",
  perHeadInPaise: "Extra guest",
  courses: "Courses",
  vegetarian: "Diet",
};

export function attrValue(key: string, value: string | number | boolean) {
  if (key === "includedGuests") return `${value} guests`;
  if (key === "courses") return String(value);
  if (key === "vegetarian") return value ? "Vegetarian" : "Non-veg options";
  return String(value);
}

export type SearchChip = "all" | "vegetarian" | "premium" | "budget" | "popular";

export const SEARCH_CHIPS: { id: SearchChip; label: string }[] = [
  { id: "all", label: "Full menu" },
  { id: "popular", label: "Most ordered" },
  { id: "premium", label: "Premium" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "budget", label: "Under ₹2,500" },
];

export function matchesChip(
  chip: SearchChip,
  item: { priceInPaise: number; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  if (chip === "all") return true;
  if (chip === "budget") return item.priceInPaise <= 250000;
  if (chip === "vegetarian") return item.attributes.vegetarian === true;
  if (chip === "premium") return item.tags.includes("premium");
  if (chip === "popular") return item.tags.includes("popular");
  return true;
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
