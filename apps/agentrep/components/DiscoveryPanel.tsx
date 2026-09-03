"use client";

import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { allIndexed, indexLateProvider, writeTool } from "@/lib/registry";
import { SLOT_LABELS } from "@/lib/types";

export function DiscoveryPanel() {
  const discovery = usePlanStore((s) => s.discovery);
  const log = usePlanStore((s) => s.log);
  const slots = usePlanStore((s) => s.slots);
  const [, force] = useState(0);
  const [indexed, setIndexed] = useState(false);

  const providers = allIndexed().filter(
    (p) => !discovery || discovery.providers.includes(p.name),
  );
  const hitByName = new Map((discovery?.hits ?? []).map((h) => [h.name, h]));

  const publish = () => {
    const late = indexLateProvider();
    if (!late) return;
    setIndexed(true);
    force((n) => n + 1);
    log("registry", `indexed ${late.name} — ${late.capability.toLowerCase()}`, "discovery");
  };

  return (
    <aside className="rail" aria-labelledby="disc-heading">
      <h2 id="disc-heading">Who can do this</h2>
      <p className="hint">
        Sites that can perform a part of the goal — not pages that mention it.
      </p>

      {discovery ? (
        <div className="query-block">
          <span className="query-kicker">Goal</span>
          <p className="query">{discovery.query}</p>
          <p className="query-meta">
            {providers.length} site{providers.length === 1 ? "" : "s"} that can do this
          </p>
        </div>
      ) : (
        <p className="rail-empty">
          No search yet. Ask ChatGPT to use AgentRep — who can do this lights up here.
        </p>
      )}

      {providers.map((p) => {
        const slot = slots[p.slot];
        const n = slot.candidates.length;
        const hit = hitByName.get(p.name);
        const search = p.tools[0];
        const book = writeTool(p);
        return (
          <article key={p.domain} className="prov">
            <div className="prov-head">
              <span className="prov-name">{p.name}</span>
              <span className="prov-cap">{p.capability}</span>
            </div>
            <p className="prov-sum">{p.summary}</p>
            <p className="prov-fill">
              fills <b>{SLOT_LABELS[p.slot]}</b>
              {n > 0 ? ` · ${n} option${n === 1 ? "" : "s"} on the board` : " · waiting for a search on the site"}
            </p>
            <ul className="prov-why">
              <li>has {search} + {book}</li>
              <li>WebMCP</li>
              {hit ? <li>keyword overlap {hit.relevance}</li> : null}
            </ul>
            <div className="prov-tools">
              {p.tools.map((t) => <span key={t}>{t}</span>)}
            </div>
          </article>
        );
      })}

      <div className="sim">
        <p>
          Indexing is simulated; the site and its tools are real. Until then
          entertainment is a hole on the graph — a capability not on the web yet.
        </p>
        <button type="button" onClick={publish} disabled={indexed}>
          {indexed ? "PokemonPartyHub is on the graph" : "A new site published — index it"}
        </button>
      </div>
    </aside>
  );
}
