import type { ProviderConfig } from "@agentrep/provider-kit";
import { paise } from "@agentrep/webmcp";

const DELIVERY = ["2026-09-12", "2026-09-19", "2026-09-26"];

export const config: ProviderConfig = {
  brand: "CakeHub",
  domain: "cakehub-webmcp.vercel.app",
  slot: "cake",
  noun: "cake",
  nounPlural: "cakes",
  accent: "#8a3a5c",
  tagline: "Celebration cakes baked to order, sized by servings and delivered on the day.",
  bookVerb: "order",
  toolNames: {
    search: "search_cakes",
    details: "get_cake_details",
    availability: "check_delivery",
    price: "get_price",
    book: "order_cake",
  },
  filters: [
    {
      key: "maxBudgetInPaise",
      type: "number",
      description: "Highest acceptable price in paise (₹2,000 = 200000).",
      match: (i, v) => i.priceInPaise <= Number(v),
    },
    {
      key: "guests",
      type: "number",
      description: "How many people the cake must serve. Filters out cakes that are too small.",
      match: (i, v) => Number(i.attributes.servings) >= Number(v),
    },
    {
      key: "theme",
      type: "string",
      description: "Decoration theme, e.g. \"Pokémon\", \"unicorn\". Matched against the cake's design tags.",
      match: (i, v) =>
        i.tags.some((t) => t.toLowerCase().includes(String(v).toLowerCase())),
    },
    {
      key: "eggless",
      type: "boolean",
      description: "Restrict to eggless cakes.",
      match: (i, v) => (v ? i.attributes.eggless === true : true),
    },
  ],
  items: [
    {
      id: "cake-pokemon",
      name: "Pokémon Cake",
      priceInPaise: paise(1800),
      blurb: "Hand-piped Pikachu on chocolate sponge. Two days' notice, no exceptions.",
      attributes: { servings: 20, flavour: "chocolate", eggless: false, tiers: 1 },
      tags: ["pokemon", "themed", "kids"],
      availableDates: DELIVERY,
    },
    {
      id: "cake-truffle",
      name: "Chocolate Truffle",
      priceInPaise: paise(1200),
      blurb: "Plain dark chocolate truffle. No decoration beyond a name plaque.",
      attributes: { servings: 15, flavour: "chocolate", eggless: false, tiers: 1 },
      tags: ["classic", "budget"],
      availableDates: DELIVERY,
    },
    {
      id: "cake-rainbow",
      name: "Rainbow Layer",
      priceInPaise: paise(2400),
      blurb: "Six coloured sponge layers under vanilla buttercream. Looks dramatic when cut.",
      attributes: { servings: 25, flavour: "vanilla", eggless: true, tiers: 1 },
      tags: ["rainbow", "unicorn", "kids", "themed"],
      availableDates: DELIVERY,
    },
    {
      id: "cake-vanilla",
      name: "Vanilla Cream",
      priceInPaise: paise(900),
      blurb: "Small eggless vanilla cake. Cheapest on the list and it tastes like it.",
      attributes: { servings: 12, flavour: "vanilla", eggless: true, tiers: 1 },
      tags: ["budget", "eggless"],
      availableDates: DELIVERY,
    },
    {
      id: "cake-photo",
      name: "Photo Print Cake",
      priceInPaise: paise(2000),
      blurb: "Edible print of a photo you send, on butterscotch sponge.",
      attributes: { servings: 20, flavour: "butterscotch", eggless: true, tiers: 1 },
      tags: ["custom", "photo", "pokemon"],
      availableDates: ["2026-09-19", "2026-09-26"],
    },
  ],
};
