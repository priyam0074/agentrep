"use client";

import { useMemo } from "react";
import { useWebMCPTools, isWebMCPAvailable } from "@agentrep/webmcp";
import { buildAgentRepTools } from "@/lib/tools";
import { Board } from "./Board";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { ActivityLog } from "./ActivityLog";
import { ApprovalPanel } from "./ApprovalPanel";
import { ProviderFrames } from "./ProviderFrames";

export function AgentRepApp() {
  useWebMCPTools(buildAgentRepTools, []);
  const available = useMemo(() => isWebMCPAvailable(), []);

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

      <ProviderFrames />
      <ApprovalPanel />
    </>
  );
}
