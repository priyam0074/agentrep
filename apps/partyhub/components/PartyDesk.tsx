"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable, formatINR } from "@agentrep/webmcp";
import { createProviderTools } from "@agentrep/provider-kit";
import type { Booking } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";
import {
  ATTR_LABELS,
  SEARCH_CHIPS,
  VENUE_VISUALS,
  matchesChip,
  matchesQuery,
  visualFor,
  type SearchChip,
} from "@/lib/desk";

interface Activity {
  tool: string;
  summary: string;
  at: number;
}

function attrValue(key: string, value: string | number | boolean) {
  if (key === "indoor") return value ? "Indoor" : "Outdoor";
  if (key === "hours") return `${value} hrs`;
  return String(value);
}

export function PartyDesk({ embedded = false }: { embedded?: boolean }) {
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<Activity[]>([]);
  const [available, setAvailable] = useState(false);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<SearchChip>("all");
  const bookings = useRef(new Map<string, Booking>());
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const pushActivity = (tool: string, summary: string) =>
    setActivity((a) => [{ tool, summary, at: Date.now() }, ...a].slice(0, 8));

  useWebMCPTools(
    () =>
      createProviderTools(
        config,
        {
          onSearchResults: (ids, label) => {
            setVisibleIds(ids);
            setFilterLabel(label);
            setFocusId(null);
          },
          onFocus: setFocusId,
          onBooked: (b) => setBookedIds((m) => ({ ...m, [b.itemId]: b.reference })),
          onActivity: pushActivity,
        },
        bookings.current,
      ),
    [config.domain],
  );

  useEffect(() => {
    setAvailable(isWebMCPAvailable());
  }, []);

  const filtered = useMemo(() => {
    return config.items.filter((item) => {
      if (visibleIds && !visibleIds.includes(item.id)) return false;
      if (!matchesChip(chip, item)) return false;
      if (!matchesQuery(query, item)) return false;
      return true;
    });
  }, [visibleIds, chip, query]);

  useEffect(() => {
    if (!focusId) return;
    const node = cardRefs.current[focusId];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: embedded ? "nearest" : "center" });
  }, [focusId, embedded]);

  const heroItem = config.items.find((i) => i.id === focusId) ?? filtered[0] ?? config.items[0];
  const heroVisual = visualFor(heroItem.id);
  const searching = query.trim().length > 0 || chip !== "all" || !!filterLabel;

  return (
    <div className="ph-root" data-embed={embedded}>
      <a className="ph-skip" href="#collection">Skip to venues</a>

      <header className="ph-nav">
        <div className="ph-brand">
          <span className="ph-brand-mark">Party</span>
          <span className="ph-brand-hub">Hub</span>
        </div>
        {!embedded && (
          <nav className="ph-nav-links" aria-label="Sections">
            <a href="#collection">Venues</a>
            <a href="#how">How it books</a>
            <a href="#pass">Desk log</a>
          </nav>
        )}
        <form
          className="ph-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            searchRef.current?.blur();
          }}
        >
          <label className="ph-sr" htmlFor={embedded ? "ph-q-embed" : "ph-q"}>Search venues</label>
          <input
            ref={searchRef}
            id={embedded ? "ph-q-embed" : "ph-q"}
            type="search"
            placeholder={embedded ? "Search venues" : "Search trampoline, Saket, Pokémon…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button type="button" className="ph-search-clear" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </form>
        <div className="ph-status">
          <span className="ph-dot" data-on={available} />
          <span>
            {available
              ? embedded
                ? "Tools live"
                : "Five tools registered for agents"
              : embedded
                ? "WebMCP off"
                : "WebMCP not detected"}
          </span>
        </div>
      </header>

      {!embedded && (
        <section className="ph-hero">
          <div className="ph-hero-copy">
            <p className="ph-eyebrow">Venues · Delhi NCR</p>
            <h1>
              The room
              <em> does the party.</em>
            </h1>
            <p className="ph-lede">
              Sixteen rooms — trampolines, a rooftop, a cinema, a barn lawn.
              Search here, or let an agent do it. Nothing is booked until you
              approve.
            </p>
            <dl className="ph-facts">
              <div>
                <dt>On the desk</dt>
                <dd>{config.items.length}</dd>
              </div>
              <div>
                <dt>Notice</dt>
                <dd>2 days</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>Delhi NCR</dd>
              </div>
            </dl>
          </div>
          <figure className="ph-hero-photo">
            <img src={heroVisual.image} alt={heroItem.name} />
            <figcaption>
              <span>{heroVisual.epithet} · {heroItem.name}</span>
              <b className="num">{formatINR(heroItem.priceInPaise)}</b>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="ph-collection" id="collection">
        <div className="ph-section-head">
          <p className="ph-eyebrow">The list</p>
          <h2>{searching ? "What matches" : "Venues, ready to book"}</h2>
          <p className="ph-filter">
            {filterLabel && <>Agent search: <b>{filterLabel}</b>. </>}
            Showing <b>{filtered.length}</b> of {config.items.length} venues
            {query.trim() ? <> for “{query.trim()}”</> : null}.
          </p>
        </div>

        <div className="ph-chips" role="toolbar" aria-label="Filter venues">
          {SEARCH_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ph-chip"
              data-on={chip === c.id}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
          {(chip !== "all" || query || filterLabel) && (
            <button
              type="button"
              className="ph-chip ph-chip-reset"
              onClick={() => {
                setChip("all");
                setQuery("");
                setVisibleIds(null);
                setFilterLabel(null);
              }}
            >
              Reset
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="ph-empty-grid">
            No venues match that search. Try indoor, a locality, or reset.
          </p>
        ) : (
          <div className="ph-grid">
            {filtered.map((item) => {
              const vis = VENUE_VISUALS[item.id] ?? visualFor(null);
              return (
                <article
                  key={item.id}
                  id={`venue-${item.id}`}
                  ref={(el) => {
                    cardRefs.current[item.id] = el;
                  }}
                  className="ph-card"
                  data-focus={focusId === item.id}
                  data-booked={!!bookedIds[item.id]}
                >
                  <div className="ph-card-art">
                    <img src={vis.image} alt="" />
                    <span className="ph-epithet">{vis.epithet}</span>
                  </div>
                  <div className="ph-card-body">
                    <div className="ph-card-top">
                      <h3>{item.name}</h3>
                      <p className="ph-price num">{formatINR(item.priceInPaise)}</p>
                    </div>
                    <p className="ph-blurb">{item.blurb}</p>
                    <ul className="ph-specs">
                      {Object.entries(item.attributes)
                        .filter(([k]) => !k.endsWith("InPaise") && k !== "includedGuests")
                        .map(([k, v]) => (
                          <li key={k}>
                            <span>{ATTR_LABELS[k] ?? k}</span>
                            <b>{attrValue(k, v)}</b>
                          </li>
                        ))}
                    </ul>
                    {bookedIds[item.id] && (
                      <p className="ph-booked">
                        Confirmed · <span className="num">{bookedIds[item.id]}</span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!embedded && (
        <section className="ph-process" id="how">
          <p className="ph-eyebrow">How a booking moves</p>
          <h2>From the list to the date.</h2>
          <ol className="ph-steps">
            <li>
              <span>01</span>
              <h3>Search the rooms</h3>
              <p>Type a locality or theme. An agent can do the same with search_venues.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Hold the date</h3>
              <p>Capacity and the calendar are real. Some rooftops skip the first Saturday.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Book once</h3>
              <p>After you approve on AgentRep. The same room and date will not be booked twice.</p>
            </li>
          </ol>
        </section>
      )}

      <section className="ph-pass" id="pass">
        <div className="ph-pass-head">
          <p className="ph-eyebrow">Desk log</p>
          <h2>{embedded ? "Agent" : "What the agent just did"}</h2>
        </div>
        {activity.length === 0 ? (
          <p className="ph-empty">
            Nothing yet. Tool calls print here as they happen — search, inspect, price, book.
          </p>
        ) : (
          <ol className="ph-tickets">
            {activity.map((a) => (
              <li key={a.at + a.tool}>
                <code>{a.tool}</code>
                <span>{a.summary}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {!embedded && (
        <footer className="ph-foot">
          <div>
            <span className="ph-brand-mark">Party</span>
            <span className="ph-brand-hub">Hub</span>
          </div>
          <p>Bookable rooms · Delhi NCR · mock catalogue, no payments</p>
        </footer>
      )}
    </div>
  );
}
