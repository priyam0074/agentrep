"use client";

import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { allIndexed, indexLateProvider } from "@/lib/registry";

export function DiscoveryPanel() {
  const discovery = usePlanStore((s) => s.discovery);
  const log = usePlanStore((s) => s.log);
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
    <aside className="rail">
      <h2>Capability discovery</h2>
      <p className="hint">
        Which sites can actually do the job, not which sites talk about it.
      </p>

      {discovery ? (
        <p className="query">{discovery.query}</p>
      ) : (
        <p className="rail-empty">
          No search yet. Ask your agent to use AgentRep and its queries appear here.
        </p>
      )}

      {providers.map((p) => (
        <div key={p.domain} className="prov">
          <div className="prov-head">
            <span className="prov-name">{p.name}</span>
            <span className="prov-cap">{p.capability}</span>
          </div>
          <p className="prov-sum">{p.summary}</p>
          <div className="prov-tools">
            {p.tools.map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>
      ))}

      <div className="sim">
        <p>
          Demo control, not a product feature: publishes a site that is already
          running and lets the registry index it, so you can see a new
          capability arrive mid-conversation.
        </p>
        <button onClick={publish} disabled={indexed}>
          {indexed ? "PokemonPartyHub indexed" : "Index a newly published site"}
        </button>
      </div>
    </aside>
  );
}
