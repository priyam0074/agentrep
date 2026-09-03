"use client";

import { useEffect, useState } from "react";
import { useWebMCPTools, isWebMCPAvailable } from "@agentrep/webmcp";
import { buildAgentRepTools } from "@/lib/tools";
import { Board } from "./Board";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { ActivityLog } from "./ActivityLog";
import { ApprovalPanel } from "./ApprovalPanel";
import { ProviderFrames } from "./ProviderFrames";
import { CapabilityHud } from "./UseCaseMap";
// Setup banner is local-dev only — hide on the live demo.
// import { WebMcpSetup } from "./WebMcpSetup";

export function AgentRepApp() {
  const [available, setAvailable] = useState(false);
  useWebMCPTools(buildAgentRepTools, [available]);
  useEffect(() => {
    const read = () => setAvailable(isWebMCPAvailable());
    read();
    const id = window.setInterval(read, 1500);
    return () => window.clearInterval(id);
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
        <p className="topbar-split">
          ChatGPT plans <span>·</span> sites execute <span>·</span> you approve
        </p>
        <span className="spacer" />
        <span className="mcp-state">
          <span className="mcp-dot" data-on={available} />
          {available
            ? "WebMCP live · 14 tools"
            : "WebMCP off — chrome://flags/#enable-webmcp-testing"}
        </span>
      </header>

      {/* {!available && <WebMcpSetup />} */}

      <section className="hud" aria-label="What AgentRep is">
        <div className="hud-thesis">
          <p className="hud-kicker">Use case, not a search page</p>
          <h2>Your agent represents you on the web.</h2>
          <p className="hud-lede">
            AgentRep never plans and never books. It finds which sites can
            actually do the job, holds the plan as a composition of slots,
            and gates anything irreversible behind a button only you can press.
          </p>
        </div>
        <CapabilityHud />
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
