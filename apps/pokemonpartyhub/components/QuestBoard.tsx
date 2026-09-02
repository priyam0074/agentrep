"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable, formatINR } from "@agentrep/webmcp";
import { createProviderTools } from "@agentrep/provider-kit";
import type { Booking } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";
import {
  ACT_IMAGE,
  ATTR_LABELS,
  SEARCH_CHIPS,
  attrValue,
  isLimited,
  matchesChip,
  matchesQuery,
  type SearchChip,
} from "@/lib/quest";

interface Activity { tool: string; summary: string; at: number; }

/** Holographic tilt + sheen, tracked per-card via pointer position. */
function useHoloTilt() {
  const reduceMotion = useRef(false);
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion.current) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return { onPointerMove: onMove, onPointerLeave: onLeave };
}

export function QuestBoard({ embedded = false }: { embedded?: boolean }) {
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
  const tilt = useHoloTilt();

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

  const searching = query.trim().length > 0 || chip !== "all" || !!filterLabel;
  const heroItem = config.items.find((i) => i.id === focusId) ?? filtered[0] ?? config.items[0];
  const heroImage = ACT_IMAGE[heroItem.id];

  return (
    <div className="pq-root" data-embed={embedded}>
      <a className="pq-skip" href="#board">Skip to the quest board</a>

      <header className="pq-nav">
        <div className="pq-brand">
          <span className="pq-brand-mark">Poke</span>
          <span className="pq-brand-hub">Quest</span>
        </div>
        {!embedded && (
          <form
            className="pq-search"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="pq-sr" htmlFor="pq-q">Search the quest board</label>
            <input
              id="pq-q"
              type="search"
              placeholder="Search Pikachu, magic, balloons…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </form>
        )}
        <div className="pq-status">
          <span className="pq-dot" data-on={available} />
          <span>
            {available
              ? embedded ? "Live" : "Tools live for agents"
              : embedded ? "Offline" : "WebMCP not detected"}
          </span>
        </div>
      </header>

      {!embedded && (
        <section className="pq-hero">
          <div className="pq-hero-copy">
            <p className="pq-eyebrow">Costumed entertainment · Delhi NCR</p>
            <h1>Every party<em>needs a legend.</em></h1>
            <p className="pq-lede">
              Four acts on the board — a Pikachu meet-and-greet, trainer
              games, close-up magic, balloon art. Search here, or hand it to
              an agent. Nothing is booked until you say go.
            </p>
            <dl className="pq-facts">
              <div><dt>On the board</dt><dd>{config.items.length}</dd></div>
              <div><dt>Ages covered</dt><dd>3–12</dd></div>
              <div><dt>City</dt><dd>Delhi NCR</dd></div>
            </dl>
          </div>
          <figure className="pq-hero-photo">
            <img src={heroImage} alt={heroItem.name} />
            <figcaption>
              <span>{heroItem.name}</span>
              <b className="num">{formatINR(heroItem.priceInPaise)}</b>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="pq-board" id="board">
        <div className="pq-section-head">
          <p className="pq-eyebrow">The board</p>
          <h2>{searching ? "What matches" : "Book the entertainment"}</h2>
          <p className="pq-filter">
            {filterLabel && <>Agent search: <b>{filterLabel}</b>. </>}
            Showing <b>{filtered.length}</b> of {config.items.length} acts
            {query.trim() ? <> for “{query.trim()}”</> : null}.
          </p>
        </div>

        <div className="pq-chips" role="toolbar" aria-label="Filter acts">
          {SEARCH_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="pq-chip"
              data-on={chip === c.id}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
          {(chip !== "all" || query || filterLabel) && (
            <button
              type="button"
              className="pq-chip pq-chip-reset"
              onClick={() => { setChip("all"); setQuery(""); setVisibleIds(null); setFilterLabel(null); }}
            >
              Reset
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="pq-empty-grid">No acts match that search. Try a different theme, or reset.</p>
        ) : (
          <div className="pq-grid">
            {filtered.map((item) => {
              const limited = isLimited(item.availableDates);
              return (
                <article
                  key={item.id}
                  id={`act-${item.id}`}
                  ref={(el) => { cardRefs.current[item.id] = el; }}
                  className="pq-card"
                  data-focus={focusId === item.id}
                  data-booked={!!bookedIds[item.id]}
                  {...tilt}
                >
                  <div className="pq-card-inner">
                    <div className="pq-card-art">
                      <img src={ACT_IMAGE[item.id]} alt="" />
                      {limited && <span className="pq-limited">Limited dates</span>}
                    </div>
                    <h3>{item.name}</h3>
                    <p className="pq-price num">{formatINR(item.priceInPaise)}</p>
                    <p className="pq-blurb">{item.blurb}</p>
                    <ul className="pq-specs">
                      {Object.entries(item.attributes).map(([k, v]) => (
                        <li key={k}>
                          <span>{ATTR_LABELS[k] ?? k}</span>
                          <b>{attrValue(k, v)}</b>
                        </li>
                      ))}
                    </ul>
                    <ul className="pq-tags">
                      {item.tags.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                    {bookedIds[item.id] && (
                      <p className="pq-booked">Confirmed · <span className="num">{bookedIds[item.id]}</span></p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!embedded && (
        <section className="pq-process">
          <p className="pq-eyebrow">How a quest gets booked</p>
          <h2>From the board to the party.</h2>
          <ol className="pq-steps">
            <li>
              <span>01</span>
              <h3>Search the board</h3>
              <p>Type a theme above, or let an agent call search_pokemon_entertainment.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Check the date</h3>
              <p>Every act keeps its own calendar. A quest with limited dates says so, up front.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Book once</h3>
              <p>After you approve on AgentRep. The same act and date is never booked twice.</p>
            </li>
          </ol>
        </section>
      )}

      <section className="pq-log">
        <div className="pq-log-head">
          <p className="pq-eyebrow">Field log</p>
          <h2>{embedded ? "Agent" : "What the agent just did"}</h2>
        </div>
        {activity.length === 0 ? (
          <p className="pq-empty">Nothing yet. Tool calls print here as they happen.</p>
        ) : (
          <ol className="pq-entries">
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
        <footer className="pq-foot">
          <div><span className="pq-brand-mark">Poke</span><span className="pq-brand-hub">Quest</span></div>
          <p>Costumed entertainment · Delhi NCR · mock catalogue, no payments</p>
        </footer>
      )}
    </div>
  );
}
