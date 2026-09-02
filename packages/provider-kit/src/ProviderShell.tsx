"use client";

import { useEffect, useRef, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable, formatINR } from "@agentrep/webmcp";
import { createProviderTools } from "./tools";
import type { Booking, ProviderConfig } from "./types";

interface Activity { tool: string; summary: string; at: number; }

/**
 * The whole provider site. Tool calls visibly drive this UI — the grid
 * filters on search, a card gets an inset rule when the agent inspects
 * it, and the activity strip at the bottom shows the agent's work in
 * the open. That visibility is the point: the user watches the agent
 * act rather than trusting a summary of what it claims to have done.
 */
export function ProviderShell({ config, embedded = false }: {
  config: ProviderConfig;
  embedded?: boolean;
}) {
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<Activity[]>([]);
  const bookings = useRef(new Map<string, Booking>());

  const pushActivity = (tool: string, summary: string) =>
    setActivity((a) => [{ tool, summary, at: Date.now() }, ...a].slice(0, 8));

  useWebMCPTools(
    () =>
      createProviderTools(config, {
        onSearchResults: (ids, label) => { setVisibleIds(ids); setFilterLabel(label); setFocusId(null); },
        onFocus: setFocusId,
        onBooked: (b) => setBookedIds((m) => ({ ...m, [b.itemId]: b.reference })),
        onActivity: pushActivity,
      }, bookings.current),
    [config.domain],
  );

  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(isWebMCPAvailable());
  }, []);
  const shown = visibleIds;

  return (
    <div className="p-shell" style={{ ["--accent" as any]: config.accent }}>
      <header className="p-head">
        <div>
          <h1 className="p-brand">
            {config.brand.replace(/Hub$/, "")}<span>Hub</span>
          </h1>
          <p className="p-tagline">{config.tagline}</p>
        </div>
        {!embedded && (
          <div className="p-status">
            <span className="p-dot" data-on={available} />
            {available
              ? `${config.brand} tools available to agents`
              : "WebMCP not detected in this browser"}
          </div>
        )}
      </header>

      <p className="p-filterline">
        {filterLabel
          ? <>Showing <b>{shown?.length ?? 0}</b> {config.nounPlural} for <b>{filterLabel}</b></>
          : <>All {config.items.length} {config.nounPlural}. An agent can narrow this.</>}
      </p>

      <div className="p-grid">
        {config.items.map((item, i) => {
          const dim = shown !== null && !shown.includes(item.id);
          return (
            <article
              key={item.id}
              className="p-card"
              data-dim={dim}
              data-focus={focusId === item.id}
              style={{ ["--i" as any]: i }}
            >
              <h3>{item.name}</h3>
              <div className="p-price num">{formatINR(item.priceInPaise)}</div>
              <p className="p-blurb">{item.blurb}</p>
              <ul className="p-attrs">
                {Object.entries(item.attributes)
                  .filter(([k]) => !k.endsWith("InPaise") && k !== "includedGuests")
                  .map(([k, v]) => <li key={k}>{k}: {String(v)}</li>)}
              </ul>
              {bookedIds[item.id] && (
                <div className="p-booked">Booked · {bookedIds[item.id]}</div>
              )}
            </article>
          );
        })}
      </div>

      <section className="p-log">
        <h4>Agent activity on this page</h4>
        {activity.length === 0
          ? <p className="p-empty">Nothing yet. Tool calls appear here as they happen.</p>
          : (
            <ol>
              {activity.map((a) => (
                <li key={a.at + a.tool}>
                  <code>{a.tool}</code>
                  <span>{a.summary}</span>
                </li>
              ))}
            </ol>
          )}
      </section>
    </div>
  );
}
