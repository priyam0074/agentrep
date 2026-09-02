"use client";

import { useEffect, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable } from "@agentrep/webmcp";
import { buildAgentRepTools } from "@/lib/tools";
import { Board } from "./Board";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { ActivityLog } from "./ActivityLog";
import { ApprovalPanel } from "./ApprovalPanel";
import { ProviderFrames } from "./ProviderFrames";

export function AgentRepApp() {
  useWebMCPTools(buildAgentRepTools, []);
  // document.modelContext only exists in the browser (and only with the
  // WebMCP flag). Reading it during render mismatches SSR and hydrates
  // with React #418. Detect after mount so server and first client paint
  // both show "not detected".
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(isWebMCPAvailable());
  }, []);

  // The provider frames are real cross-origin iframes. Mounting them
  // during the initial (server-matching) render fights the hydration
  // pass for that DOM subtree and reliably tips React into "Maximum
  // update depth exceeded" once the origins are real (Origin-Agent-
  // Cluster puts each in its own process). Mount them client-side only,
  // one tick after hydration has settled.
  const [showFrames, setShowFrames] = useState(false);
  useEffect(() => {
    setShowFrames(true);
  }, []);

  return (
    <>
      <header className="masthead">
        <h1 className="wordmark">AgentRep</h1>
        <p>Your agent represents you on the web.</p>
        <span className="spacer" />
        <span className="mcp-state">
          <span className="mcp-dot" data-on={available} />
          {available
            ? "14 tools registered for agents"
            : "WebMCP not detected — enable chrome://flags/#enable-webmcp-testing"}
        </span>
      </header>

      <div className="frame">
        <DiscoveryPanel />
        <Board />
        <ActivityLog />
      </div>

      {showFrames && <ProviderFrames />}
      <ApprovalPanel />
    </>
  );
}
