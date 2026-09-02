"use client";

import { usePlanStore } from "@/store/planStore";
import { allIndexed, discover } from "@/lib/registry";
import { SLOT_ORDER, SLOT_REQUIRED, type SlotId } from "@/lib/types";

const EXAMPLES = [
  "children's birthday venue in Delhi",
  "catering for twenty kids",
  "themed cake and entertainer",
];

const SLOT_VERB: Record<SlotId, string> = {
  venue: "book a place",
  food: "feed the table",
  cake: "order the cake",
  entertainment: "host the room",
};

export function UseCaseMap() {
  const discovery = usePlanStore((s) => s.discovery);
  const slots = usePlanStore((s) => s.slots);
  const setDiscovery = usePlanStore((s) => s.setDiscovery);
  const log = usePlanStore((s) => s.log);
  usePlanStore((s) => s.activity.length);

  const indexed = allIndexed();
  const matchedNames = new Set(discovery?.providers ?? []);
  const live = !!discovery;

  const runQuery = (query: string) => {
    const hits = discover(query, 5);
    setDiscovery(query, hits.map((h) => h.name));
    log("discover_sites", `"${query}" → ${hits.length} provider(s)`, "discovery");
  };

  return (
    <figure className="uc" data-live={live} aria-label="Use case map">
      <figcaption className="uc-caption" aria-live="polite">
        <span className="uc-stereo">«use case»</span>
        <strong>{live ? discovery.query : "Represent you while a party is assembled on the web"}</strong>
      </figcaption>

      <div className="uc-stage">
        <div className="uc-actors" aria-label="Actors">
          <article className="uc-actor" data-role="primary">
            <span className="uc-stereo">«primary actor»</span>
            <b>You</b>
            <span>goal, budget, the yes</span>
          </article>
          <svg className="uc-link" viewBox="0 0 48 12" aria-hidden="true">
            <title>associates</title>
            <line x1="2" y1="6" x2="46" y2="6" />
            <polygon points="46,6 38,2 38,10" />
          </svg>
          <article className="uc-actor" data-role="agent">
            <span className="uc-stereo">«supporting»</span>
            <b>Agent</b>
            <span>reasons, never books</span>
          </article>
          <svg className="uc-link" viewBox="0 0 48 12" aria-hidden="true">
            <title>uses</title>
            <line x1="2" y1="6" x2="46" y2="6" />
            <polygon points="46,6 38,2 38,10" />
          </svg>
          <article className="uc-actor" data-role="system">
            <span className="uc-stereo">«system»</span>
            <b>AgentRep</b>
            <span>discovers · holds · gates</span>
          </article>
        </div>

        <div className="uc-boundary">
          <p className="uc-boundary-label">system boundary</p>
          <ol className="uc-includes">
            {SLOT_ORDER.map((id) => {
              const slot = slots[id];
              const picked = slot.candidates.find((c) => c.id === slot.selectedCandidateId);
              const provider = indexed.find((p) => p.slot === id);
              const hit = provider && matchedNames.has(provider.name);
              const dim = live && !hit;
              return (
                <li
                  key={id}
                  className="uc-inc"
                  data-slot={id}
                  data-hit={!!hit}
                  data-filled={!!picked}
                  data-dim={dim}
                >
                  <span className="uc-inc-rel">
                    {SLOT_REQUIRED[id] ? "«include»" : "«extend»"}
                  </span>
                  <span className="uc-inc-slot">{slot.label}</span>
                  <span className="uc-inc-goal">{SLOT_VERB[id]}</span>
                  <span className="uc-inc-site">
                    {provider
                      ? hit || !live
                        ? provider.name
                        : "not in this search"
                      : "unindexed"}
                  </span>
                  {picked && (
                    <span className="uc-inc-pick">{picked.name}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="uc-examples">
        <p>Try a goal — same path your agent takes.</p>
        <div className="uc-chips" role="group" aria-label="Example goals">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              className="uc-chip"
              data-on={discovery?.query === q}
              onClick={() => runQuery(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
}
