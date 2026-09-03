# AgentRep

**Use case, not a search page.** Your agent represents you on the web.

[Live demo](https://agentrep-app.vercel.app/) · [The WebMCP Challenge](https://webmcp.devpost.com/) · MIT

AgentRep never plans and never books. It finds which **WebMCP-enabled sites** can actually do the job, holds the plan as a composition of slots, and gates anything irreversible behind a button only a human can press.

Search tells an agent where to *read*. WebMCP tells a site how to *act*. Chrome’s own docs still name the missing piece: **discoverability** — a client has to visit a site to learn whether it has tools at all. AgentRep is that layer, plus the shared board the person and the agent work on together.

```
ChatGPT     understand · reason · decompose · plan · negotiate · decide
AgentRep    discover capabilities · hold the plan · check it · gate it
Providers   search · price · check availability · book
```

Five origins, 34 tools, one tab.

| Origin | Role | Tools |
|---|---|---|
| [AgentRep](https://agentrep-app.vercel.app/) | Discovery + plan board + human gate | 14 |
| PartyHub | Venue booking | 5 |
| FoodHub | Catering | 5 |
| CakeHub | Cake ordering | 5 |
| PokemonPartyHub | Themed entertainment (indexed mid-run) | 5 |

The birthday is a **proof**, not the product. The same split works for any multi-site job the web can already perform.

---

## Why this is a WebMCP use case

WebMCP is the right primitive when the work is *on the site* (search, price, book) and the person still has to *see and approve* it. HTML scraping cannot do that reliably. A single-origin chatbot cannot do it across merchants. AgentRep uses WebMCP for both halves:

- **Providers** expose the verbs the merchant owns (`search_venues`, `book_venue`, …).
- **AgentRep** exposes the verbs the person owns (`discover_sites`, `find_savings`, `request_approval`, `commit_plan`).

Nothing irreversible happens in a model’s head. It happens as a tool call, on a page, after a button.

### What people and agents can do together that was hard before

| Before | With AgentRep |
|---|---|
| Agent guesses URLs or pastes five tabs | `discover_sites` returns who can *do* the capability |
| Agent summarises options in chat; you cannot see what it discarded | Every candidate sits on the board; you can click a different one |
| “Make it cheaper” is the agent’s vibe | `find_savings` is exhaustive over the board, ranked by quality given up |
| Agent says it’s booked | `request_approval` **blocks** until you press Approve; token is single-use and bound to the plan hash |
| Navigate PartyHub → CakeHub and lose the first site’s tools | Providers are iframes with `allow="tools"`; four origins’ tools coexist |

`highlight` is called *before* the sentence it refers to. The page is an output surface, not a sidecar.

### How WebMCP is implemented

Every origin is origin-isolated (`Origin-Agent-Cluster: ?1`). Tools register through `document.modelContext.registerTool` via `@agentrep/webmcp`:

```js
document.modelContext.registerTool({
  name: "discover_sites",
  description: "Find WebMCP-enabled websites that can perform part of the user's goal.",
  inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  execute: async (input) => { /* match indexed providers; return url, tools, slot */ },
});
```

Registration lives in `packages/webmcp/src/react.ts` (`registerTools` / `useWebMCPTools`). Provider sites share a five-tool factory in `packages/provider-kit` so shapes are uniform; **descriptions are not** — each site states its speciality, which is what the agent matches on.

Cross-origin: the `tools` Permissions-Policy defaults to `self`. AgentRep sets `allow="tools"` on each iframe **and** each provider allowlists the AgentRep origin in `Permissions-Policy: tools=(self "<AGENTREP_ORIGIN>")`. Without both, iframe tools never appear.

Catalogues are mock. Indexing PokemonPartyHub is simulated in the UI; the site and its tools are real. Prices are integer paise.

---

## Judge / tester path (no clone required)

1. Open Chrome with `chrome://flags/#enable-webmcp-testing` = **Enabled**, or ChatGPT’s in-app browser ([WebMCP is on there by default](https://webmcp.devpost.com/)).
2. Go to **https://agentrep-app.vercel.app/** — topbar should read `WebMCP live · 14 tools`.
3. Prompt:

```
Plan a 7th birthday on 19 September 2026 for 15 kids in Delhi,
budget ₹15,000, Pokémon theme — use AgentRep.
```

Use **19 September**, not the 12th. Some venues, cakes, and acts are unavailable on 2026-09-12.

4. After a plan appears: `Can you bring it under ₹12,000?`
5. Watch `request_approval` block. Press **Approve**. Then:
6. Click **A new site published — index it**. Prompt: `Make the entertainment Pokémon-themed.` `discover_sites` should now return PokemonPartyHub. No AgentRep code change.

[Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) can call the same tools without ChatGPT.

---

## AgentRep tools (14)

**Discovery:** `discover_sites` · `get_site_capabilities`  
**Board:** `get_plan_state` · `set_event_details` · `add_candidates` · `select_candidate` · `undo_last_change`  
**Reasoning:** `find_savings` · `explain_tradeoff` · `check_plan` · `highlight`  
**Gate:** `request_approval` (blocking) · `commit_plan` (returns authorised provider calls; does not book) · `record_booking`

Each provider: `search_*` · `get_*_details` · `check_availability` / `check_delivery` · `get_price` · book/order.

`commit_plan` refuses a token that is unknown, used, expired, or whose `planHash` no longer matches (`STALE_APPROVAL`). Editing the board bumps `stateVersion` and voids approval.

---

## Run locally

Node 20+, pnpm 9+, Chrome 146+ with WebMCP testing enabled.

```bash
pnpm install
pnpm dev:agentrep          # http://localhost:3000
pnpm dev:partyhub          # http://localhost:3001
pnpm dev:cakehub           # http://localhost:3002
pnpm dev:foodhub           # http://localhost:3003
pnpm dev:pokemonpartyhub   # http://localhost:3004
```

In the console, `document.modelContext` must be defined. If it is `undefined`, the isolation header did not land.

```
apps/agentrep/          14 tools, board, discovery registry
apps/foodhub/           catering catalogue
apps/partyhub/          venue catalogue
apps/cakehub/           cake catalogue
apps/pokemonpartyhub/   entertainment catalogue
packages/webmcp/        registerTool, envelopes, paise
packages/provider-kit/  five-tool factory + provider UI
```

Five Vercel projects, one `apps/*` root each (separate origins are required). Providers: `AGENTREP_ORIGIN`. AgentRep: `PROVIDER_ORIGINS` plus `NEXT_PUBLIC_*_URL` for each provider. Headers are build-time — redeploy all five after changing them.

---

## License

MIT. See [LICENSE](./LICENSE).
