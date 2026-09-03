"use client";

import { useState } from "react";

/**
 * WebMCP is a Chrome flag, not an AgentRep setting. This panel cannot
 * turn the flag on in the current tab — it opens a dedicated Chrome
 * window with --enable-webmcp-testing so planning tools can register.
 */
export function WebMcpSetup() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const launch = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/launch-chrome", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setNote(body.error || "Could not launch Chrome. Run pnpm chrome:webmcp from the repo.");
        return;
      }
      setNote("A Chrome window is opening with WebMCP on. Use that window — this tab cannot pick up the flag.");
    } catch {
      setNote("Could not reach the local launcher. Is AgentRep running on port 3000?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mcp-gate" role="status">
      <p className="mcp-gate-kicker">WebMCP is off in this browser</p>
      <h2>Planning tools cannot register here</h2>
      <p>
        AgentRep already sends <code>Origin-Agent-Cluster: ?1</code>. Chrome
        still hides <code>document.modelContext</code> until you enable
        WebMCP testing. That is a browser flag, not a site setting — this
        tab cannot flip it.
      </p>
      <ol>
        <li>Click below to open a <b>separate Chrome window</b> with the flag on, or</li>
        <li>
          In Chrome go to <code>chrome://flags/#enable-webmcp-testing</code>,
          set <b>Enabled</b>, relaunch, then reopen <code>http://localhost:3000</code>.
        </li>
      </ol>
      <div className="mcp-gate-actions">
        <button type="button" className="btn btn-primary" onClick={launch} disabled={busy}>
          {busy ? "Opening Chrome…" : "Open Chrome with WebMCP"}
        </button>
      </div>
      {note && <p className="mcp-gate-note">{note}</p>}
      <p className="mcp-gate-fine">
        Needs Chrome 146+ (149+ is fine). Safari, Firefox, and Cursor’s
        preview cannot host WebMCP. ChatGPT’s in-app browser must also have
        the flag, or use this Chrome window with the inspector extension.
      </p>
    </section>
  );
}
