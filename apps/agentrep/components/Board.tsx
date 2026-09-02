"use client";

import { formatINR } from "@agentrep/webmcp";
import { usePlanStore } from "@/store/planStore";
import { SLOT_ORDER, type SlotId } from "@/lib/types";

const SLOT_COLOUR: Record<SlotId, string> = {
  venue: "#2f5d50",
  food: "#a8551f",
  cake: "#8a3a5c",
  entertainment: "#2d4b8f",
};

/** Highlights fade after 12s so the board doesn't stay lit up forever. */
function useHighlight() {
  const h = usePlanStore((s) => s.highlight);
  if (!h || Date.now() - h.at > 12000) return null;
  return h;
}

export function Board() {
  const slots = usePlanStore((s) => s.slots);
  const event = usePlanStore((s) => s.event);
  // Subscribe to the functions, then call them during render. Calling
  // deriveTotals()/validate() *inside* the selector returns a new object
  // every snapshot, which useSyncExternalStore treats as a store change
  // and loops until React hits max update depth (#185) and hydration
  // fails (#418).
  const deriveTotals = usePlanStore((s) => s.deriveTotals);
  const validate = usePlanStore((s) => s.validate);
  const select = usePlanStore((s) => s.select);
  const totals = deriveTotals();
  const violations = validate();
  const hl = useHighlight();

  const budget = totals.budgetInPaise;
  const over = budget !== null && totals.selectedTotalInPaise > budget;
  // Scale to whichever is larger so an over-budget plan visibly overflows
  // past the ceiling marker rather than silently pinning at 100%.
  const scale = Math.max(budget ?? 0, totals.selectedTotalInPaise) || 1;

  const slotHl = (id: SlotId) =>
    hl?.targets.some((t) => t.kind === "slot" && t.id === id) ? hl.intent : undefined;
  const candHl = (id: string) =>
    !!hl?.targets.some((t) => t.kind === "candidate" && t.id === id);
  const violationHl = (code: string) =>
    !!hl?.targets.some((t) => t.kind === "violation" && t.id === code);

  const formula = SLOT_ORDER.map((id) => {
    const slot = slots[id];
    const picked = slot.candidates.find((x) => x.id === slot.selectedCandidateId);
    return { id, label: slot.label, filled: !!picked, name: picked?.name ?? null, optional: !slot.required };
  });

  return (
    <main className="stage" id="board">
      <section className="compose" aria-label="Plan as composition">
        <p className="compose-kicker"><span className="uc-stereo">«composition»</span> the party is the sum of its slots</p>
        <ol className="compose-line">
          {formula.map((n, i) => (
            <li key={n.id} data-filled={n.filled} data-optional={n.optional}>
              {i > 0 && <span className="compose-op" aria-hidden="true">{n.optional ? "⊕" : "+"}</span>}
              <span className="compose-slot">{n.label}</span>
              <span className="compose-val">{n.filled ? n.name : n.optional ? "optional" : "empty"}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="meter">
        <div className="meter-top">
          <div className="meter-total num" data-over={over}>
            {formatINR(totals.selectedTotalInPaise)}
          </div>
          <div className="meter-of">
            {budget === null
              ? "no budget set yet"
              : <>of <b className="num">{formatINR(budget)}</b>{event.guestCount ? ` · ${event.guestCount} guests` : ""}{event.date ? ` · ${event.date}` : ""}</>}
          </div>
          <div className="meter-spacer" />
          {budget !== null && (
            <div className="meter-left">
              {over ? "over by" : "still to spend"}
              <b className="num" data-over={over}>
                {formatINR(Math.abs(totals.remainingInPaise ?? 0))}
              </b>
            </div>
          )}
        </div>

        <div className="bar" role="img"
             aria-label={`${formatINR(totals.selectedTotalInPaise)} committed${budget !== null ? ` of ${formatINR(budget)}` : ""}`}>
          {SLOT_ORDER.map((id) => {
            const slot = slots[id];
            const c = slot.candidates.find((x) => x.id === slot.selectedCandidateId);
            if (!c) return null;
            const pct = (c.priceInPaise / scale) * 100;
            return (
              <div key={id} className="bar-seg"
                   style={{ width: `${pct}%`, background: SLOT_COLOUR[id] }}>
                {pct > 11 ? slot.label : ""}
              </div>
            );
          })}
          {budget !== null && totals.selectedTotalInPaise > budget && (
            <div className="bar-ceiling" style={{ left: `${(budget / scale) * 100}%` }} />
          )}
        </div>
      </section>

      <section className="slots">
        {SLOT_ORDER.map((id) => {
          const slot = slots[id];
          const picked = slot.candidates.find((x) => x.id === slot.selectedCandidateId);
          return (
            <article key={id} className="slot" data-hl={slotHl(id)}>
              <div className="slot-head">
                <span className="slot-name">{slot.label}</span>
                {!slot.required && <span className="slot-optional">optional</span>}
                <span className="spacer" />
                {picked && <span className="slot-price num">{formatINR(picked.priceInPaise)}</span>}
              </div>

              {picked ? (
                <div className="pick">
                  <span className="pick-name">{picked.name}</span>
                  <span className="pick-provider">{picked.provider}</span>
                  {slot.bookedReference && (
                    <span className="pick-ref">confirmed · {slot.bookedReference}</span>
                  )}
                  {slot.selectionReason && (
                    <span className="pick-reason">{slot.selectionReason}</span>
                  )}
                </div>
              ) : (
                <p className="slot-empty" style={{ margin: 0 }}>
                  {slot.candidates.length
                    ? "Options gathered, nothing chosen yet."
                    : "Waiting for this include — search the provider, or let the agent."}
                </p>
              )}

              {slot.candidates.length > 0 && (
                <div className="cands">
                  {slot.candidates.map((c) => (
                    <button
                      key={c.id}
                      className="cand"
                      data-on={c.id === slot.selectedCandidateId}
                      data-hl={candHl(c.id)}
                      onClick={() => select(c.id, "chosen by hand")}
                      title={`${c.provider} · ${formatINR(c.priceInPaise)}`}
                    >
                      {c.name} · <span className="num">{formatINR(c.priceInPaise)}</span>
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {violations.length > 0 && (
        <section className="violations">
          {violations.map((v, i) => (
            <div key={v.code + i} className="violation" data-sev={v.severity}
                 style={violationHl(v.code) ? { background: "#fdf0ec" } : undefined}>
              <code>{v.code}</code>
              <span>{v.message}</span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
