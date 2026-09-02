"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable, formatINR } from "@agentrep/webmcp";
import { createProviderTools } from "@agentrep/provider-kit";
import type { Booking } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";
import {
  ATTR_LABELS,
  CAKE_VISUALS,
  SEARCH_CHIPS,
  matchesChip,
  matchesQuery,
  visualFor,
  type SearchChip,
} from "@/lib/atelier";

interface Activity {
  tool: string;
  summary: string;
  at: number;
}

function attrValue(key: string, value: string | number | boolean) {
  if (key === "eggless") return value ? "Yes" : "No";
  return String(value);
}

export function CakeAtelier({ embedded = false }: { embedded?: boolean }) {
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
    <div className="ch-root" data-embed={embedded}>
      <a className="ch-skip" href="#collection">Skip to cakes</a>

      <header className="ch-nav">
        <div className="ch-brand">
          <span className="ch-brand-mark">Cake</span>
          <span className="ch-brand-hub">Hub</span>
        </div>
        {!embedded && (
          <nav className="ch-nav-links" aria-label="Sections">
            <a href="#collection">Cakes</a>
            <a href="#atelier">Atelier</a>
            <a href="#pass">Kitchen pass</a>
          </nav>
        )}
        <form
          className="ch-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            searchRef.current?.blur();
          }}
        >
          <label className="ch-sr" htmlFor={embedded ? "ch-q-embed" : "ch-q"}>Search cakes</label>
          <input
            ref={searchRef}
            id={embedded ? "ch-q-embed" : "ch-q"}
            type="search"
            placeholder={embedded ? "Search cakes" : "Search chocolate, Pokémon, eggless…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button type="button" className="ch-search-clear" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </form>
        <div className="ch-status">
          <span className="ch-dot" data-on={available} />
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
        <section className="ch-hero">
          <div className="ch-hero-copy">
            <p className="ch-eyebrow">Patisserie · Greater Kailash</p>
            <h1>
              The cake
              <em> is the event.</em>
            </h1>
            <p className="ch-lede">
              Sixteen cakes on the counter — chocolate, mango, rasmalai, a
              sculpted kids cake. Search here, or let an agent do it. Nothing
              leaves the kitchen until you approve.
            </p>
            <dl className="ch-facts">
              <div>
                <dt>On the counter</dt>
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
          <figure className="ch-hero-photo">
            <img src={heroVisual.image} alt={heroItem.name} />
            <figcaption>
              <span>{heroVisual.epithet} · {heroItem.name}</span>
              <b className="num">{formatINR(heroItem.priceInPaise)}</b>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="ch-collection" id="collection">
        <div className="ch-section-head">
          <p className="ch-eyebrow">The counter</p>
          <h2>{searching ? "What matches" : "Cakes, ready to order"}</h2>
          <p className="ch-filter">
            {filterLabel && <>Agent search: <b>{filterLabel}</b>. </>}
            Showing <b>{filtered.length}</b> of {config.items.length} cakes
            {query.trim() ? <> for “{query.trim()}”</> : null}.
          </p>
        </div>

        <div className="ch-chips" role="toolbar" aria-label="Filter cakes">
          {SEARCH_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ch-chip"
              data-on={chip === c.id}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
          {(chip !== "all" || query || filterLabel) && (
            <button
              type="button"
              className="ch-chip ch-chip-reset"
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
          <p className="ch-empty-grid">
            No cakes match that search. Try a flavour, or reset the filters.
          </p>
        ) : (
          <div className="ch-grid">
            {filtered.map((item) => {
              const vis = CAKE_VISUALS[item.id] ?? visualFor(null);
              return (
                <article
                  key={item.id}
                  id={`cake-${item.id}`}
                  ref={(el) => {
                    cardRefs.current[item.id] = el;
                  }}
                  className="ch-card"
                  data-focus={focusId === item.id}
                  data-booked={!!bookedIds[item.id]}
                >
                  <div className="ch-card-art">
                    <img src={vis.image} alt="" />
                    <span className="ch-epithet">{vis.epithet}</span>
                  </div>
                  <div className="ch-card-body">
                    <div className="ch-card-top">
                      <h3>{item.name}</h3>
                      <p className="ch-price num">{formatINR(item.priceInPaise)}</p>
                    </div>
                    <p className="ch-blurb">{item.blurb}</p>
                    <ul className="ch-specs">
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
                      <p className="ch-booked">
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
        <section className="ch-process" id="atelier">
          <p className="ch-eyebrow">How an order moves</p>
          <h2>From the counter to the table.</h2>
          <ol className="ch-steps">
            <li>
              <span>01</span>
              <h3>Search the case</h3>
              <p>Type a flavour or theme above. An agent can do the same with search_cakes.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Hold the date</h3>
              <p>Delivery is a real constraint. Two days’ notice, and only the dates a cake can keep.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Order once</h3>
              <p>After you approve on AgentRep. The same cake and date will not be booked twice.</p>
            </li>
          </ol>
        </section>
      )}

      <section className="ch-pass" id="pass">
        <div className="ch-pass-head">
          <p className="ch-eyebrow">Kitchen pass</p>
          <h2>{embedded ? "Agent" : "What the agent just did"}</h2>
        </div>
        {activity.length === 0 ? (
          <p className="ch-empty">
            Nothing yet. Tool calls print here as they happen — search, inspect, price, order.
          </p>
        ) : (
          <ol className="ch-tickets">
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
        <footer className="ch-foot">
          <div>
            <span className="ch-brand-mark">Cake</span>
            <span className="ch-brand-hub">Hub</span>
          </div>
          <p>Baked to order · Delhi NCR · mock catalogue, no payments</p>
        </footer>
      )}
    </div>
  );
}
