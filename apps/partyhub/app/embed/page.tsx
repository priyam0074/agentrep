/**
 * Same site, same tools, rendered for embedding inside AgentRep.
 * Keeping this as a distinct route means the standalone page can carry
 * chrome (status line, footer) that would be noise in an iframe, while
 * the WebMCP surface stays identical.
 */
import { ProviderShell } from "@agentrep/provider-kit";
import { config } from "@/lib/provider";

export default function EmbedPage() {
  return <ProviderShell config={config} embedded />;
}
