"use client";

import { usePlanStore } from "@/store/planStore";

const KIND_LABEL: Record<string, string> = {
  discovery: "discover",
  read: "read",
  write: "write",
  reason: "check",
  gate: "gate",
};

const clock = (at: number) =>
  new Date(at).toLocaleTimeString("en-GB", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

export function ActivityLog() {
  const activity = usePlanStore((s) => s.activity);
  const chrono = [...activity].reverse();

  return (
    <aside className="rail" aria-labelledby="seq-heading">
      <h2 id="seq-heading">Agent trace</h2>
      <p className="hint">Tool calls, in order — watch this during the demo.</p>

      {chrono.length === 0 ? (
        <p className="rail-empty">Waiting for discover_sites.</p>
      ) : (
        <ol className="acts">
          {chrono.map((a, i) => (
            <li key={a.id} className="act" data-kind={a.kind}>
              <span className="act-step">{String(i + 1).padStart(2, "0")}</span>
              <span className="act-time">{clock(a.at)}</span>
              <span className="act-kind">{KIND_LABEL[a.kind] ?? a.kind}</span>
              <span className="act-tool">{a.tool}</span>
              {a.summary && <span className="act-sum">{a.summary}</span>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
