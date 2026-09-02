/** Presentation-only. Catalogue facts stay on `config.items` for the agent. */

export interface MenuVisual {
  image: string;
  epithet: string;
  credit?: { name: string; license: string; url: string };
}

const v = (image: string, epithet: string, credit?: MenuVisual["credit"]): MenuVisual => ({
  image,
  epithet,
  ...(credit ? { credit } : {}),
});

const pizza = v("/food/food-pizza.jpg", "Wood-fired");
const snacks = v("/food/food-mini-feast.jpg", "Light");
const packed = v("/food/food-snack-boxes.jpg", "Packed", {
  name: "Ella Olsson",
  license: "CC BY 2.0",
  url: "https://creativecommons.org/licenses/by/2.0",
});
const deluxe = v("/food/food-deluxe.jpg", "Live counter", {
  name: "PattayaPatrol",
  license: "CC BY-SA 4.0",
  url: "https://creativecommons.org/licenses/by-sa/4.0",
});
const burgers = v("/food/food-burgers.jpg", "Sliders");
const tacos = v("/food/food-tacos.jpg", "Build-your-own");
const pasta = v("/food/food-pasta.jpg", "Sauce on");
const biryani = v("/food/food-biryani.jpg", "Dum");
const chaat = v("/food/food-chaat.jpg", "Street");
const thali = v("/food/food-thali.jpg", "Thali");
const south = v("/food/food-south.jpg", "Tava");
const chinese = v("/food/food-chinese.jpg", "Wok");
const grill = v("/food/food-grill.jpg", "Char");
const wraps = v("/food/food-wraps.jpg", "Wrapped");
const dessert = v("/food/food-dessert.jpg", "Sweet");
const fruit = v("/food/food-fruit.jpg", "Cut");
const brunch = v("/food/food-brunch.jpg", "Morning");
const kids = v("/food/food-kids-party.jpg", "Party table");

export const MENU_VISUALS: Record<string, MenuVisual> = {
  "food-kids-party": kids,
  "food-mini-feast": snacks,
  "food-deluxe": deluxe,
  "food-snack-boxes": packed,
  "food-pizza-party": pizza,
  "food-thin-crust": pizza,
  "food-burger-sliders": burgers,
  "food-chicken-sliders": burgers,
  "food-taco-bar": tacos,
  "food-nachos-bar": tacos,
  "food-pasta-bar": pasta,
  "food-mac-cheese": pasta,
  "food-biryani-veg": biryani,
  "food-biryani-chicken": biryani,
  "food-chaat-station": chaat,
  "food-samosa-chaat": chaat,
  "food-pav-bhaji": chaat,
  "food-chole-bhature": thali,
  "food-rajma-chawal": thali,
  "food-north-thali": thali,
  "food-gujarati-thali": thali,
  "food-kerala-sadya": south,
  "food-dosa-counter": south,
  "food-idli-vada": south,
  "food-south-mini": south,
  "food-chinese-box": chinese,
  "food-noodle-wok": chinese,
  "food-momos-platter": chinese,
  "food-paneer-tikka": grill,
  "food-tandoori-mixed": grill,
  "food-bbq-grill": grill,
  "food-kebabs-rolls": wraps,
  "food-wraps-station": wraps,
  "food-hotdog-cart": burgers,
  "food-popcorn-candy": dessert,
  "food-waffle-station": dessert,
  "food-ice-cream-cart": dessert,
  "food-cupcake-tower": dessert,
  "food-jalebi-rabri": dessert,
  "food-fruit-platter": fruit,
  "food-salad-bar": fruit,
  "food-breakfast-brunch": brunch,
  "food-high-tea": brunch,
  "food-poha-cutlets": brunch,
};

export const DEFAULT_VISUAL = deluxe;

export function visualFor(id: string | null): MenuVisual {
  if (id && MENU_VISUALS[id]) return MENU_VISUALS[id];
  return DEFAULT_VISUAL;
}

export const ATTR_LABELS: Record<string, string> = {
  includedGuests: "Feeds",
  perHeadInPaise: "Extra guest",
  courses: "Courses",
  vegetarian: "Diet",
  cuisine: "Cuisine",
};

export function attrValue(key: string, value: string | number | boolean) {
  if (key === "includedGuests") return `${value} guests`;
  if (key === "courses") return String(value);
  if (key === "vegetarian") return value ? "Vegetarian" : "Non-veg options";
  return String(value);
}

export type SearchChip =
  | "all"
  | "vegetarian"
  | "premium"
  | "budget"
  | "popular"
  | "pizza"
  | "indian"
  | "dessert";

export const SEARCH_CHIPS: { id: SearchChip; label: string }[] = [
  { id: "all", label: "Full menu" },
  { id: "popular", label: "Most ordered" },
  { id: "pizza", label: "Pizza" },
  { id: "indian", label: "Indian" },
  { id: "dessert", label: "Dessert" },
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
  if (chip === "pizza") return item.attributes.cuisine === "pizza" || item.tags.includes("pizza");
  if (chip === "indian")
    return item.attributes.cuisine === "indian"
      || item.attributes.cuisine === "south"
      || item.tags.includes("indian");
  if (chip === "dessert") return item.attributes.cuisine === "dessert" || item.tags.includes("dessert");
  return true;
}

export function matchesQuery(
  query: string,
  item: { name: string; blurb: string; tags: string[]; attributes: Record<string, string | number | boolean> },
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.name} ${item.blurb} ${item.tags.join(" ")} ${item.attributes.cuisine ?? ""}`.toLowerCase();
  return hay.includes(q);
}
