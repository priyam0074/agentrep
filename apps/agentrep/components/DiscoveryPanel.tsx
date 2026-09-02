"use client";

import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { allIndexed, indexLateProvider } from "@/lib/registry";

export function DiscoveryPanel() {
  const discovery = usePlanStore((s) => s.discovery);
  const log = usePlanStore((s) => s.log);
  const slots = usePlanStore((s) => s.slots);
  const [, force] = useState(0);
  const [indexed, setIndexed] = useState(false);

  const providers = allIndexed().filter(
    (p) => !discovery || discovery.providers.includes(p.name),
  );

  const publish = () => {
    const late = indexLateProvider();
    if (!late) return;
    setIndexed(true);
    force((n) => n + 1);
    log("registry", `indexed ${late.name} — ${late.capability.toLowerCase()}`, "discovery");
  };

  return (
    <aside className="rail" aria-labelledby="disc-heading">
      <h2 id="disc-heading">Actors &amp; capabilities</h2>
      <p className="hint">
        Sites that can perform a part of the goal — not pages that mention it.
      </p>

      {discovery ? (
        <div className="query-block">
          <span className="uc-stereo">«goal»</span>
          <p className="query">{discovery.query}</p>
          <p className="query-meta">
            {providers.length} include{providers.length === 1 ? "" : "s"} matched
          </p>
        </div>
      ) : (
        <p className="rail-empty">
          No search yet. Run a goal on the map, or ask your agent to call
          discover_sites — the includes light up here.
        </p>
      )}

      {providers.map((p) => {
        const slot = slots[p.slot];
        const n = slot.candidates.length;
        return (
          <article key={p.domain} className="prov">
            <div className="prov-head">
              <span className="prov-name">{p.name}</span>
              <span className="prov-cap">{p.capability}</span>
            </div>
            <p className="prov-sum">{p.summary}</p>
            <p className="prov-fill">
              fills <b>{slot.label}</b>
              {n > 0 ? ` · ${n} option${n === 1 ? "" : "s"} on the board` : " · waiting for a search on the site"}
            </p>
            <div className="prov-tools">
              {p.tools.map((t) => <span key={t}>{t}</span>)}
            </div>
          </article>
        );
      })}

      <div className="sim">
        <p>
          Demo control: indexes a live site that was unpublished at the start,
          so a new «extend» can arrive mid-conversation.
        </p>
        <button type="button" onClick={publish} disabled={indexed}>
          {indexed ? "PokemonPartyHub indexed" : "Index a newly published site"}
        </button>
      </div>
    </aside>
  );
}
