"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable, formatINR } from "@agentrep/webmcp";
import { createProviderTools } from "@agentrep/provider-kit";
import type { Booking } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";
import {
  ATTR_LABELS,
  MENU_VISUALS,
  SEARCH_CHIPS,
  attrValue,
  matchesChip,
  matchesQuery,
  visualFor,
  type SearchChip,
} from "@/lib/menu";

interface Activity { tool: string; summary: string; at: number; }

export function FeastHall({ embedded = false }: { embedded?: boolean }) {
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
          onSearchResults: (ids, label) => { setVisibleIds(ids); setFilterLabel(label); setFocusId(null); },
          onFocus: setFocusId,
          onBooked: (b) => setBookedIds((m) => ({ ...m, [b.itemId]: b.reference })),
          onActivity: pushActivity,
        },
        bookings.current,
      ),
    [config.domain],
  );

  useEffect(() => { setAvailable(isWebMCPAvailable()); }, []);

  const filtered = useMemo(
    () =>
      config.items.filter((item) => {
        if (visibleIds && !visibleIds.includes(item.id)) return false;
        if (!matchesChip(chip, item)) return false;
        if (!matchesQuery(query, item)) return false;
        return true;
      }),
    [visibleIds, chip, query],
  );

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
    <div className="fh-root" data-embed={embedded}>
      <a className="fh-skip" href="#menu">Skip to the menu</a>

      <header className="fh-nav">
        <div className="fh-brand">
          <span className="fh-brand-mark">Food</span>
          <span className="fh-brand-hub">Hub</span>
        </div>
        {!embedded && (
          <form className="fh-search" role="search" onSubmit={(e) => { e.preventDefault(); searchRef.current?.blur(); }}>
            <label className="fh-sr" htmlFor="fh-q">Search the menu</label>
            <input
              ref={searchRef}
              id="fh-q"
              type="search"
              placeholder="Search pizza, vegetarian, deluxe…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="fh-search-clear" onClick={() => setQuery("")}>Clear</button>
            )}
          </form>
        )}
        <div className="fh-status">
          <span className="fh-dot" data-on={available} />
          <span>
            {available
              ? embedded ? "Tools live" : "Five tools registered for agents"
              : embedded ? "WebMCP off" : "WebMCP not detected"}
          </span>
        </div>
      </header>

      {!embedded && (
        <section className="fh-hero">
          <div className="fh-hero-copy">
            <p className="fh-eyebrow">Catering · Delhi NCR</p>
            <h1>Fed properly,<em>or not at all.</em></h1>
            <p className="fh-lede">
              Four packages, from snack boxes to a live pasta counter. Prices
              cover a set headcount; extra guests are costed per head, up
              front. Search here, or let an agent do it.
            </p>
            <dl className="fh-facts">
              <div><dt>Packages</dt><dd>{config.items.length}</dd></div>
              <div><dt>From</dt><dd className="num">₹120/head</dd></div>
              <div><dt>City</dt><dd>Delhi NCR</dd></div>
            </dl>
          </div>
          <figure className="fh-hero-photo">
            <img src={heroVisual.image} alt={heroItem.name} />
            <figcaption>
              <span>{heroVisual.epithet} · {heroItem.name}</span>
              <b className="num">{formatINR(heroItem.priceInPaise)}</b>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="fh-menu" id="menu">
        <div className="fh-section-head">
          <p className="fh-eyebrow">The menu</p>
          <h2>{searching ? "What matches" : "Packages, ready to order"}</h2>
          <p className="fh-filter">
            {filterLabel && <>Agent search: <b>{filterLabel}</b>. </>}
            Showing <b>{filtered.length}</b> of {config.items.length} packages
            {query.trim() ? <> for “{query.trim()}”</> : null}.
          </p>
        </div>

        <div className="fh-chips" role="toolbar" aria-label="Filter packages">
          {SEARCH_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="fh-chip"
              data-on={chip === c.id}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
          {(chip !== "all" || query || filterLabel) && (
            <button
              type="button"
              className="fh-chip fh-chip-reset"
              onClick={() => { setChip("all"); setQuery(""); setVisibleIds(null); setFilterLabel(null); }}
            >
              Reset
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="fh-empty-grid">No packages match that search. Try a filter, or reset.</p>
        ) : (
          <div className="fh-grid">
            {filtered.map((item) => {
              const vis = MENU_VISUALS[item.id] ?? visualFor(null);
              const perHead = Number(item.attributes.perHeadInPaise ?? 0);
              return (
                <article
                  key={item.id}
                  ref={(el) => { cardRefs.current[item.id] = el; }}
                  className="fh-card"
                  data-focus={focusId === item.id}
                  data-booked={!!bookedIds[item.id]}
                >
                  <div className="fh-card-art">
                    <img src={vis.image} alt="" />
                    <span className="fh-epithet">{vis.epithet}</span>
                    {item.attributes.vegetarian === true && <span className="fh-veg" title="Vegetarian">Veg</span>}
                  </div>
                  <div className="fh-card-body">
                    <div className="fh-card-top">
                      <h3>{item.name}</h3>
                      <p className="fh-price num">{formatINR(item.priceInPaise)}</p>
                    </div>
                    <p className="fh-blurb">{item.blurb}</p>
                    <ul className="fh-specs">
                      {Object.entries(item.attributes)
                        .filter(([k]) => k !== "perHeadInPaise")
                        .map(([k, v]) => (
                          <li key={k}><span>{ATTR_LABELS[k] ?? k}</span><b>{attrValue(k, v)}</b></li>
                        ))}
                    </ul>
                    {perHead > 0 && (
                      <p className="fh-perhead">+{formatINR(perHead)} per extra guest</p>
                    )}
                    {bookedIds[item.id] && (
                      <p className="fh-booked">Confirmed · <span className="num">{bookedIds[item.id]}</span></p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!embedded && (
        <section className="fh-process">
          <p className="fh-eyebrow">How an order comes together</p>
          <h2>From the menu to the table.</h2>
          <ol className="fh-steps">
            <li>
              <span>01</span>
              <h3>Pick a package</h3>
              <p>Search above, or an agent calls search_packages with a budget or headcount.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Price the headcount</h3>
              <p>Base price covers a set number of guests; get_price adds the rest per head.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Order once</h3>
              <p>After you approve on AgentRep. The same order is never placed twice.</p>
            </li>
          </ol>
        </section>
      )}

      <section className="fh-pass">
        <div className="fh-pass-head">
          <p className="fh-eyebrow">Kitchen pass</p>
          <h2>{embedded ? "Agent" : "What the agent just did"}</h2>
        </div>
        {activity.length === 0 ? (
          <p className="fh-empty">Nothing yet. Tool calls print here as they happen.</p>
        ) : (
          <ol className="fh-tickets">
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
        <footer className="fh-foot">
          <div><span className="fh-brand-mark">Food</span><span className="fh-brand-hub">Hub</span></div>
          <p>Catering · Delhi NCR · mock catalogue, no payments</p>
        </footer>
      )}

      {!embedded && (
        <p className="fh-credits">
          Photos:{" "}
          {Object.values(MENU_VISUALS)
            .filter((v) => v.credit)
            .map((v, i, arr) => (
              <span key={v.image}>
                <a href={v.credit!.url} target="_blank" rel="noopener noreferrer">{v.credit!.name}</a>
                {" "}({v.credit!.license}){i < arr.length - 1 ? ", " : ""}
              </span>
            ))}
          . Others public domain / CC0.
        </p>
      )}
    </div>
  );
}
