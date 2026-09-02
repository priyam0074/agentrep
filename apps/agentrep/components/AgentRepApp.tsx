"use client";

import { useEffect, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable } from "@agentrep/webmcp";
import { buildAgentRepTools } from "@/lib/tools";
import { Board } from "./Board";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { ActivityLog } from "./ActivityLog";
import { ApprovalPanel } from "./ApprovalPanel";
import { ProviderFrames } from "./ProviderFrames";
import { UseCaseMap } from "./UseCaseMap";

export function AgentRepApp() {
  useWebMCPTools(buildAgentRepTools, []);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(isWebMCPAvailable());
  }, []);

  const [showFrames, setShowFrames] = useState(false);
  useEffect(() => {
    setShowFrames(true);
  }, []);

  return (
    <>
      <a className="skip" href="#board">Skip to the plan board</a>
      <header className="topbar">
        <h1 className="wordmark">AgentRep</h1>
        <span className="topbar-mark">representation protocol</span>
        <span className="spacer" />
        <span className="mcp-state">
          <span className="mcp-dot" data-on={available} />
          {available
            ? "14 tools registered for agents"
            : "WebMCP not detected — enable chrome://flags/#enable-webmcp-testing"}
        </span>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">Use case, not a search page</p>
            <h2>Your agent represents you on the web.</h2>
            <p className="hero-lede">
              AgentRep never plans and never books. It finds which sites can
              actually do the job, holds the plan as a composition of slots,
              and gates anything irreversible behind a button only you can press.
            </p>
          </div>
        </div>
        <UseCaseMap />
      </section>

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
