"use client";

import { allIndexed } from "@/lib/registry";
import { usePlanStore } from "@/store/planStore";

/**
 * Provider sites embedded in the board.
 *
 * The `tools` Permissions Policy defaults to `self`, which blocks tool
 * registration inside a cross-origin iframe. allow="tools" here plus an
 * allowlist in each provider's Permissions-Policy header opts them in,
 * which means every origin's tools coexist in one tab. Without this the
 * agent has to navigate between sites and loses the tools of whichever
 * one it just left, mid-plan.
 *
 * If the browser under test does not honour this, the sites still work
 * standalone — see README, "multi-origin findings".
 */
export function ProviderFrames() {
  usePlanStore((s) => s.activity.length);
  const providers = allIndexed();

  return (
    <section className="frames">
      <div className="frames-head">
        <h2>Included systems</h2>
        <p>
          Separate origins. Each registers its own WebMCP tools into this tab.
        </p>
        <span className="spacer" />
        <p>{providers.length} origin{providers.length === 1 ? "" : "s"} live</p>
      </div>
      <div className="frames-grid">
        {providers.map((p) => (
          <div key={p.domain}>
            <div className="frame-label">{p.name} · {p.tools[p.tools.length - 1]} · {p.domain}</div>
            <div className="frame-box">
              <iframe
                src={p.embedUrl}
                allow="tools"
                title={`${p.name} — ${p.capability}`}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
