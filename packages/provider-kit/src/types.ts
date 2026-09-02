export interface CatalogueItem {
  id: string;
  name: string;
  priceInPaise: number;
  /** Rendered on the card and returned to the agent verbatim. */
  blurb: string;
  /** Comparable facts. Keep keys consistent across a provider's items. */
  attributes: Record<string, string | number | boolean>;
  /** ISO dates this item can serve. Empty means always available. */
  availableDates?: string[];
  tags: string[];
}

export interface FilterSpec {
  key: string;
  type: "string" | "number" | "boolean";
  description: string;
  /** Return true if the item satisfies this filter value. */
  match: (item: CatalogueItem, value: any) => boolean;
}

export interface ProviderConfig {
  /** "PartyHub" */
  brand: string;
  domain: string;
  /** Slot this provider fills on the AgentRep board. */
  slot: "venue" | "food" | "cake" | "entertainment";
  tagline: string;
  /** "venue", "cake", "catering package", "entertainer" */
  noun: string;
  nounPlural: string;
  accent: string;
  toolNames: {
    search: string;
    details: string;
    availability: string;
    price: string;
    book: string;
  };
  /** Verb used in the booking tool description: "book", "order". */
  bookVerb: string;
  filters: FilterSpec[];
  items: CatalogueItem[];
}

export interface Booking {
  reference: string;
  itemId: string;
  itemName: string;
  priceInPaise: number;
  date: string | null;
  placedAt: string;
}
