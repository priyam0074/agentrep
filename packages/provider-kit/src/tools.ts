import { ToolDefinition, toolOk, toolErr, formatINR } from "@agentrep/webmcp";
import type { Booking, CatalogueItem, ProviderConfig } from "./types";

export interface ProviderHooks {
  /** Called after a search so the page can filter its grid on screen. */
  onSearchResults: (itemIds: string[], label: string) => void;
  /** Called when the agent inspects one item, so the page can focus it. */
  onFocus: (itemId: string | null) => void;
  /** Called after a booking so the page can render the confirmation. */
  onBooked: (booking: Booking) => void;
  /** Every tool call, for the on-page activity strip. */
  onActivity: (toolName: string, summary: string) => void;
}

const publicItem = (i: CatalogueItem) => ({
  id: i.id,
  name: i.name,
  priceInPaise: i.priceInPaise,
  blurb: i.blurb,
  attributes: { ...i.attributes, themes: i.tags.join(" ") },
  tags: i.tags,
});

const ref = (prefix: string) =>
  prefix.toUpperCase().slice(0, 4) +
  "-" +
  Math.random().toString(36).slice(2, 7).toUpperCase();

/**
 * Builds the five WebMCP tools every provider site exposes.
 *
 * The shapes are deliberately uniform across providers so an agent that
 * has used one provider can predict the next. The descriptions are not
 * uniform — each states the provider's actual speciality, because that
 * is what the agent matches against when deciding where to go.
 */
export function createProviderTools(
  config: ProviderConfig,
  hooks: ProviderHooks,
  bookings: Map<string, Booking>,
): ToolDefinition[] {
  const { brand, noun, nounPlural, toolNames, items, filters } = config;

  const filterProperties: Record<string, unknown> = {};
  for (const f of filters) {
    filterProperties[f.key] = { type: f.type, description: f.description };
  }

  const find = (id: string) => items.find((i) => i.id === id);

  return [
    // ── search ────────────────────────────────────────────────────
    {
      name: toolNames.search,
      description:
        `Search ${brand}'s catalogue of ${nounPlural}. ${config.tagline} ` +
        `Returns every match with its id, price in paise and comparable ` +
        `attributes. Call this first on this site — the other tools all ` +
        `take an id that only this tool can give you. Omit a filter to ` +
        `leave it unconstrained; passing no filters returns everything, ` +
        `which is often the right move when the user's requirements are ` +
        `loose. The page grid visibly filters to your results, so the ` +
        `user can see what you are looking at.`,
      inputSchema: {
        type: "object",
        properties: {
          ...filterProperties,
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            description: "Cap the number of results. Defaults to all matches.",
          },
        },
        additionalProperties: false,
      },
      execute: async (input: Record<string, any>) => {
        let results = items.slice();
        const applied: string[] = [];

        for (const f of filters) {
          const value = input?.[f.key];
          if (value === undefined || value === null || value === "") continue;
          results = results.filter((i) => f.match(i, value));
          applied.push(`${f.key}=${value}`);
        }
        if (input?.limit) results = results.slice(0, input.limit);

        const label = applied.length ? applied.join(", ") : `all ${nounPlural}`;
        hooks.onSearchResults(results.map((i) => i.id), label);
        hooks.onActivity(toolNames.search, `${results.length} ${nounPlural} (${label})`);

        if (!results.length) {
          return toolErr(
            "NO_MATCHES",
            `No ${nounPlural} at ${brand} match ${label}.`,
            "Relax or drop a filter and search again. Price and capacity " +
              "filters are the usual culprits.",
          );
        }

        const cheapest = Math.min(...results.map((i) => i.priceInPaise));
        return toolOk(
          { provider: brand, count: results.length, items: results.map(publicItem) },
          `${results.length} ${nounPlural} at ${brand}, from ${formatINR(cheapest)}.`,
        );
      },
    },

    // ── details ───────────────────────────────────────────────────
    {
      name: toolNames.details,
      description:
        `Get everything ${brand} knows about one ${noun}: full attributes, ` +
        `inclusions, and the dates it can serve. Use before recommending ` +
        `something, so you can describe it accurately instead of ` +
        `paraphrasing a search result.`,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: `Id from ${toolNames.search}.` },
        },
        required: ["id"],
        additionalProperties: false,
      },
      execute: async (input: { id: string }) => {
        const item = find(input.id);
        if (!item) {
          return toolErr(
            "NOT_FOUND",
            `${brand} has no ${noun} with id "${input.id}".`,
            `Call ${toolNames.search} to get valid ids.`,
          );
        }
        hooks.onFocus(item.id);
        hooks.onActivity(toolNames.details, item.name);
        return toolOk(
          {
            ...publicItem(item),
            availableDates: item.availableDates ?? "any date",
            provider: brand,
            providerDomain: config.domain,
          },
          `${item.name} — ${formatINR(item.priceInPaise)}.`,
        );
      },
    },

    // ── availability ──────────────────────────────────────────────
    {
      name: toolNames.availability,
      description:
        `Check whether a specific ${noun} can serve a given date, and for ` +
        `how many people. Always call this before ${config.bookVerb}ing — ` +
        `search results do not account for the event date, so a ${noun} ` +
        `that looks perfect may be unavailable.`,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date", description: "ISO date, e.g. 2026-09-12." },
          guests: { type: "integer", minimum: 1, description: "Number of people to serve." },
        },
        required: ["id", "date"],
        additionalProperties: false,
      },
      execute: async (input: { id: string; date: string; guests?: number }) => {
        const item = find(input.id);
        if (!item) {
          return toolErr("NOT_FOUND", `No ${noun} with id "${input.id}".`,
            `Call ${toolNames.search} first.`);
        }
        const dateOk =
          !item.availableDates?.length || item.availableDates.includes(input.date);
        const capacity = Number(item.attributes.capacity ?? item.attributes.servings ?? 0);
        const capacityOk = !input.guests || !capacity || capacity >= input.guests;

        hooks.onFocus(item.id);
        hooks.onActivity(
          toolNames.availability,
          `${item.name} on ${input.date}: ${dateOk && capacityOk ? "available" : "unavailable"}`,
        );

        return toolOk(
          {
            id: item.id,
            available: dateOk && capacityOk,
            dateAvailable: dateOk,
            capacity: capacity || null,
            capacitySufficient: capacityOk,
            alternativeDates: dateOk ? [] : item.availableDates ?? [],
          },
          dateOk && capacityOk
            ? `${item.name} is available on ${input.date}.`
            : !dateOk
              ? `${item.name} is not available on ${input.date}.`
              : `${item.name} serves ${capacity}, short of ${input.guests}.`,
        );
      },
    },

    // ── price ─────────────────────────────────────────────────────
    {
      name: toolNames.price,
      description:
        `Get the final price for a ${noun} at a given headcount, including ` +
        `any per-head charges and applicable discounts. The price in search ` +
        `results is a base price — use this for anything you put in a ` +
        `budget the user will see.`,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          guests: { type: "integer", minimum: 1 },
        },
        required: ["id"],
        additionalProperties: false,
      },
      execute: async (input: { id: string; guests?: number }) => {
        const item = find(input.id);
        if (!item) {
          return toolErr("NOT_FOUND", `No ${noun} with id "${input.id}".`,
            `Call ${toolNames.search} first.`);
        }
        const perHead = Number(item.attributes.perHeadInPaise ?? 0);
        const included = Number(item.attributes.includedGuests ?? 0);
        const extra =
          input.guests && perHead && input.guests > included
            ? (input.guests - included) * perHead
            : 0;
        const total = item.priceInPaise + extra;

        hooks.onActivity(toolNames.price, `${item.name} → ${formatINR(total)}`);
        return toolOk(
          {
            id: item.id,
            basePriceInPaise: item.priceInPaise,
            extraGuestChargeInPaise: extra,
            totalInPaise: total,
            guests: input.guests ?? null,
          },
          extra
            ? `${formatINR(total)} (${formatINR(item.priceInPaise)} base + ${formatINR(extra)} for extra guests).`
            : `${formatINR(total)}.`,
        );
      },
    },

    // ── book ──────────────────────────────────────────────────────
    {
      name: toolNames.book,
      description:
        `${config.bookVerb[0].toUpperCase() + config.bookVerb.slice(1)} a ` +
        `${noun} at ${brand}. THIS IS CONSEQUENTIAL AND IRREVERSIBLE. Only ` +
        `call it after the user has explicitly approved this specific ` +
        `${noun} at this specific price — not merely said the plan looks ` +
        `good in general. Returns a confirmation reference. Calling it ` +
        `twice for the same ${noun} and date returns the existing booking ` +
        `rather than duplicating it.`,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date" },
          guests: { type: "integer", minimum: 1 },
          contactName: { type: "string", description: "Who the booking is for." },
        },
        required: ["id", "date"],
        additionalProperties: false,
      },
      execute: async (input: { id: string; date: string; guests?: number; contactName?: string }) => {
        const item = find(input.id);
        if (!item) {
          return toolErr("NOT_FOUND", `No ${noun} with id "${input.id}".`,
            `Call ${toolNames.search} first.`);
        }
        const key = `${input.id}:${input.date}`;
        const existing = bookings.get(key);
        if (existing) {
          return toolOk(existing, `Already booked — reference ${existing.reference}.`);
        }
        const dateOk =
          !item.availableDates?.length || item.availableDates.includes(input.date);
        if (!dateOk) {
          return toolErr(
            "UNAVAILABLE",
            `${item.name} cannot serve ${input.date}.`,
            `Call ${toolNames.availability} for alternative dates, or pick another ${noun}.`,
          );
        }

        const booking: Booking = {
          reference: ref(brand),
          itemId: item.id,
          itemName: item.name,
          priceInPaise: item.priceInPaise,
          date: input.date,
          placedAt: new Date().toISOString(),
        };
        bookings.set(key, booking);
        hooks.onBooked(booking);
        hooks.onActivity(toolNames.book, `${item.name} — ${booking.reference}`);

        return toolOk(
          { ...booking, provider: brand },
          `${item.name} confirmed for ${input.date}. Reference ${booking.reference}.`,
        );
      },
    },
  ];
}

/**
 * Items declare themes through `tags`. The search tool surfaces them as a
 * `themes` attribute so an agent copying attributes onto AgentRep's board
 * carries the theme information with it — without this, the board cannot
 * tell "not themed" from "theme unknown".
 */
export const withThemes = (i: CatalogueItem) => ({
  ...i,
  attributes: { ...i.attributes, themes: i.tags.join(" ") },
});
