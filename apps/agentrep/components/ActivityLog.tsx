"use client";

import { usePlanStore } from "@/store/planStore";

/**
 * Every tool call, in the open. The point of WebMCP is that the agent
 * acts through declared tools rather than by poking at the DOM, and this
 * is where that becomes visible to the person it is acting for.
 */
export function ActivityLog() {
  const activity = usePlanStore((s) => s.activity);

  return (
    <aside className="rail">
      <h2>Agent activity</h2>
      <p className="hint">Tool calls on this board, newest first.</p>

      {activity.length === 0 ? (
        <p className="rail-empty">Nothing yet.</p>
      ) : (
        <div className="acts">
          {activity.map((a) => (
            <div key={a.id} className="act" data-kind={a.kind}>
              <span className="act-tool">{a.tool}</span>
              {a.summary && <span className="act-sum">{a.summary}</span>}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
