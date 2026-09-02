"use client";

/**
 * Same site, same tools, rendered for embedding inside AgentRep.
 * Standalone carries the desk chrome; this route stays compact
 * for a 300px iframe without changing the WebMCP surface.
 */
import { PartyDesk } from "@/components/PartyDesk";

export default function EmbedPage() {
  return <PartyDesk embedded />;
}
