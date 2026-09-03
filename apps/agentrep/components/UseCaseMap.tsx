"use client";

import { usePlanStore } from "@/store/planStore";
import { allKnown, discover, writeTool } from "@/lib/registry";
import { SLOT_ORDER, SLOT_REQUIRED, type Slot, type SlotId } from "@/lib/types";

const EXAMPLES = [
  "venue in Delhi",
  "catering for twenty",
  "themed entertainment",
];

const SLOT_JOB: Record<SlotId, string> = {
  venue: "Book a place",
  food: "Arrange food",
  cake: "Order dessert",
  entertainment: "Add entertainment",
};

const PHASE_COPY = {
  awaiting: "Missing",
  idle: "Waiting",
  discovered: "Found",
  gathered: "Options",
  selected: "Chosen",
  booked: "Booked",
} as const;

type NodePhase = keyof typeof PHASE_COPY;

function phaseOf(
  slot: Slot,
  indexed: boolean | undefined,
  hit: boolean,
): NodePhase {
  if (!indexed) return "awaiting";
  if (slot.bookedReference) return "booked";
  if (slot.selectedCandidateId) return "selected";
  if (slot.candidates.length > 0) return "gathered";
  if (hit) return "discovered";
  return "idle";
}

/** Compact live HUD — four capabilities, no UML. Lights up from tool calls. */
export function CapabilityHud() {
  const discovery = usePlanStore((s) => s.discovery);
  const slots = usePlanStore((s) => s.slots);
  const setDiscovery = usePlanStore((s) => s.setDiscovery);
  const log = usePlanStore((s) => s.log);
  usePlanStore((s) => s.activity.length);

  const known = allKnown();
  const matchedNames = new Set(discovery?.providers ?? []);
  const live = !!discovery;
  const occasion = usePlanStore((s) => s.event.occasion);

  const runQuery = (query: string) => {
    const hits = discover(query, 5);
    setDiscovery(query, hits.map((h) => ({
      name: h.name, capability: h.capability, tools: h.tools,
      relevance: h.relevance, slot: h.slot,
    })));
    log("discover_sites", `"${query}" → ${hits.length} provider(s)`, "discovery");
  };

  return (
    <div className="hud-map" data-live={live}>
      <div className="hud-run">
        <p className="hud-run-label">This run</p>
        <p className="hud-run-title" aria-live="polite">
          {live ? discovery.query : occasion}
        </p>
      </div>

      <ol className="hud-nodes" aria-label="Capabilities for this run">
        {SLOT_ORDER.map((id) => {
          const slot = slots[id];
          const picked = slot.candidates.find((c) => c.id === slot.selectedCandidateId);
          const provider = known.find((p) => p.slot === id);
          const hit = !!(provider?.indexed && matchedNames.has(provider.name));
          const phase = phaseOf(slot, provider?.indexed, hit);
          const dim = live && phase !== "awaiting" && !hit && phase === "idle";
          return (
            <li
              key={id}
              className="hud-node"
              data-slot={id}
              data-phase={phase}
              data-dim={dim}
            >
              <span className="hud-status">{PHASE_COPY[phase]}</span>
              <strong className="hud-slot">{slot.label}</strong>
              <span className="hud-job">{SLOT_JOB[id]}</span>
              <span className="hud-site">
                {phase === "awaiting"
                  ? "Not on the web yet"
                  : provider?.name ?? "—"}
              </span>
              {provider?.indexed ? (
                <span className="hud-tool">{writeTool(provider)}</span>
              ) : (
                !SLOT_REQUIRED[id] && <span className="hud-tool">optional</span>
              )}
              {picked && <span className="hud-pick">{picked.name}</span>}
            </li>
          );
        })}
      </ol>

      <details className="hud-practice">
        <summary>Practice a search</summary>
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
      </details>
    </div>
  );
}

/** @deprecated name kept so older imports still typecheck if any remain */
export const UseCaseMap = CapabilityHud;
