/**
 * AgentRep is itself a WebMCP surface, so it needs origin isolation too.
 * It additionally embeds provider sites, which is why `tools` is granted
 * to the provider origins as well as self.
 */
const PROVIDERS = (process.env.PROVIDER_ORIGINS ||
  "http://localhost:3001 http://localhost:3002 http://localhost:3003 http://localhost:3004")
  .split(/\s+/)
  .filter(Boolean);

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Origin-Agent-Cluster", value: "?1" },
          {
            key: "Permissions-Policy",
            value: `tools=(self ${PROVIDERS.map((o) => `"${o}"`).join(" ")})`,
          },
        ],
      },
    ];
  },
  transpilePackages: ["@agentrep/webmcp"],
};

export default nextConfig;
