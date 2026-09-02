"use client";

/**
 * Same site, same tools, rendered for embedding inside AgentRep.
 * Standalone carries the nav/hero/process chrome; this route stays
 * compact for a narrow iframe without changing the WebMCP surface.
 */
import { QuestBoard } from "@/components/QuestBoard";

export default function EmbedPage() {
  return <QuestBoard embedded />;
}
