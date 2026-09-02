import type { ProviderConfig } from "@agentrep/provider-kit";
import { paise } from "@agentrep/webmcp";

export const config: ProviderConfig = {
  brand: "FoodHub",
  domain: "foodhub-webmcp.vercel.app",
  slot: "food",
  noun: "catering package",
  nounPlural: "catering packages",
  accent: "#a8551f",
  tagline: "Catering built for children's parties. Prices include a set headcount; extra guests are charged per head.",
  bookVerb: "order",
  toolNames: {
    search: "search_packages",
    details: "get_package_details",
    availability: "check_availability",
    price: "get_price",
    book: "place_order",
  },
  filters: [
    {
      key: "maxBudgetInPaise",
      type: "number",
      description: "Highest acceptable base price in paise. Note this excludes extra-guest charges — use get_price for the real total.",
      match: (i, v) => i.priceInPaise <= Number(v),
    },
    {
      key: "guests",
      type: "number",
      description: "Headcount to feed. Does not filter anything out; every package scales, but larger groups cost more.",
      match: () => true,
    },
    {
      key: "vegetarianOnly",
      type: "boolean",
      description: "Restrict to fully vegetarian packages.",
      match: (i, v) => (v ? i.attributes.vegetarian === true : true),
    },
  ],
  items: [
    {
      id: "food-kids-party",
      name: "Kids Party Package",
      priceInPaise: paise(4500),
      blurb: "Pizza, fries, drinks and dessert. The standard order, and the one most parents pick.",
      attributes: { includedGuests: 15, perHeadInPaise: paise(180), vegetarian: true, courses: 4 },
      tags: ["kids", "pizza", "popular"],
    },
    {
      id: "food-mini-feast",
      name: "Mini Feast",
      priceInPaise: paise(2800),
      blurb: "Sandwiches, fries and juice. Less food than the party package, and it shows.",
      attributes: { includedGuests: 12, perHeadInPaise: paise(150), vegetarian: true, courses: 3 },
      tags: ["kids", "budget"],
    },
    {
      id: "food-deluxe",
      name: "Deluxe Spread",
      priceInPaise: paise(6800),
      blurb: "Live pasta counter, chaat station, mocktails and dessert. A proper spread for the adults too.",
      attributes: { includedGuests: 20, perHeadInPaise: paise(240), vegetarian: false, courses: 6 },
      tags: ["premium", "adults"],
    },
    {
      id: "food-snack-boxes",
      name: "Snack Boxes",
      priceInPaise: paise(1950),
      blurb: "Individually packed boxes handed out at the end. Cheapest option, and no service staff.",
      attributes: { includedGuests: 15, perHeadInPaise: paise(120), vegetarian: true, courses: 1 },
      tags: ["budget", "takeaway"],
    },
  ],
};
