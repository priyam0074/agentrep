/**
 * WebMCP will not initialise without these headers.
 *
 *  Origin-Agent-Cluster: ?1  — WebMCP is only available in origin-isolated
 *      documents. Without this, document.modelContext is silently undefined
 *      and you will lose an afternoon wondering why.
 *
 *  Permissions-Policy: tools=... — the `tools` policy defaults to `self`,
 *      which blocks registration inside a cross-origin iframe. AgentRep
 *      embeds these sites, so its origin is allowlisted here and it passes
 *      allow="tools" on the iframe.
 *
 * Set AGENTREP_ORIGIN in the Vercel project settings once AgentRep is
 * deployed. The fallback keeps local development working.
 */
const AGENTREP_ORIGIN = process.env.AGENTREP_ORIGIN || "http://localhost:3000";

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Origin-Agent-Cluster", value: "?1" },
          { key: "Permissions-Policy", value: `tools=(self "${AGENTREP_ORIGIN}")` },
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${AGENTREP_ORIGIN}`,
          },
        ],
      },
    ];
  },
  transpilePackages: ["@agentrep/webmcp", "@agentrep/provider-kit"],
};

export default nextConfig;
