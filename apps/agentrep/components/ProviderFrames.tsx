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
  const discovery = usePlanStore((s) => s.discovery);
  const providers = allIndexed();
  const relevant = discovery
    ? providers.filter((p) => discovery.providers.includes(p.name))
    : providers;

  return (
    <section className="frames">
      <div className="frames-head">
        <h2>Included systems</h2>
        <p>
          Separate origins inside the use case — each registers its own tools here.
        </p>
        <span className="spacer" />
        <p>{relevant.length} embedded</p>
      </div>
      <div className="frames-grid">
        {relevant.map((p) => (
          <div key={p.domain}>
            <div className="frame-label">{p.name} · {p.domain}</div>
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
