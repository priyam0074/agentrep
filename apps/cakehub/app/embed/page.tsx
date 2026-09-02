"use client";

/**
 * Same site, same tools, rendered for embedding inside AgentRep.
 * Standalone carries the atelier chrome; this route stays compact
 * for a 300px iframe without changing the WebMCP surface.
 */
import { CakeAtelier } from "@/components/CakeAtelier";

export default function EmbedPage() {
  return <CakeAtelier embedded />;
}
