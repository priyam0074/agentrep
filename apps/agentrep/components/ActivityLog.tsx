"use client";

import { usePlanStore } from "@/store/planStore";

const KIND_LABEL: Record<string, string> = {
  discovery: "discover",
  read: "read",
  write: "write",
  reason: "check",
  gate: "gate",
};

export function ActivityLog() {
  const activity = usePlanStore((s) => s.activity);

  return (
    <aside className="rail" aria-labelledby="seq-heading">
      <h2 id="seq-heading">Sequence</h2>
      <p className="hint">Tool calls on this board, newest first — the interaction diagram, live.</p>

      {activity.length === 0 ? (
        <p className="rail-empty">No messages yet. A search starts the sequence.</p>
      ) : (
        <ol className="acts">
          {activity.map((a, i) => (
            <li key={a.id} className="act" data-kind={a.kind}>
              <span className="act-step">{String(activity.length - i).padStart(2, "0")}</span>
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
