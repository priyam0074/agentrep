# AgentRep

**AgentRep is a capability discovery layer for the agentic web.**

[Live demo](https://agentrep-app.vercel.app/) · [The WebMCP Challenge](https://webmcp.devpost.com/) · MIT

WebMCP lets independent websites expose structured tools directly to agents. But before an agent can search, price, validate, or transact, it still has to know **which websites can do the work**. AgentRep addresses that discovery problem.

The birthday is a **proof**, not the product. The same pattern applies to any multi-site goal where an agent must discover and compose independently owned web capabilities.

```text
User
  ↓
ChatGPT
  reason · decompose · compose · recompose · invoke WebMCP tools
  ↓
AgentRep
  capability discovery · shared plan · validation/state · human approval
  ↓
WebMCP providers
  search · price · validate availability · transact
```

ChatGPT is the reasoning and composition agent. AgentRep does **not** plan the event or execute provider transactions itself: it discovers relevant capabilities, maintains the shared plan state, validates it, and enforces the human approval boundary. Provider sites expose and own their domain actions.

> **WebMCP makes individual websites agent-ready. AgentRep makes their capabilities discoverable and composable.**

### The demo ecosystem

Five independent origins. 34 WebMCP tools. One agent-visible workspace.

| Site | Capability | Discoverable at demo start | Tools |
|---|---|---:|---:|
| [AgentRep](https://agentrep-app.vercel.app/) | Discovery, shared plan, validation, human gate | — | 14 |
| PartyHub | Birthday venues | Yes | 5 |
| FoodHub | Catering | Yes | 5 |
| CakeHub | Cakes | Yes | 5 |
| PokemonPartyHub | Themed entertainment | No — indexed mid-task | 5 |

The fourth provider is the key demonstration: while a task is already underway, PokemonPartyHub becomes discoverable. The user asks for Pokémon entertainment without naming a website; AgentRep makes that new capability discoverable and ChatGPT adds it to the existing plan.

---

## Why this needs WebMCP

Search tells an agent where to *read*. WebMCP tells a site how to *act*. Chrome’s own WebMCP materials identify the missing piece: a client has to visit a site to learn whether it has tools at all. AgentRep is the discovery layer for that problem, plus the shared board the person and agent use together.

WebMCP is the right primitive when work happens *on the site*—searching, pricing, checking availability, and booking—and a person must still be able to see and approve it. HTML scraping cannot offer that contract reliably, and a single-origin chatbot cannot provide it across independent merchants.

- **Providers** expose the verbs their business owns (`search_venues`, `book_venue`, and similar tools).
- **AgentRep** exposes the verbs the person and shared plan need (`discover_sites`, `find_savings`, `request_approval`, `commit_plan`).

Nothing irreversible happens in a model’s head. It happens as a tool call, on a provider page, after a human approval.

### What people and agents can do together that was hard before

| Before | With AgentRep |
|---|---|
| Agent guesses URLs or opens tabs one by one | `discover_sites` returns who can *perform* a capability |
| Agent summarizes options in chat; the person cannot see what was discarded | Candidates sit on the shared board; the person can select a different option |
| “Make it cheaper” is an ungrounded request | `find_savings` evaluates the board and ranks trade-offs by quality given up |
| Agent says it is booked | `request_approval` blocks until the person presses Approve; its token is single-use and bound to the plan hash |
| Moving between provider tabs loses the earlier sites’ tools | Providers are iframes with `allow="tools"`; four origins’ tools coexist |

`highlight` is called *before* the sentence it refers to. The page is an output surface, not a sidecar.

---

## Judge / tester path (no clone required)

This is the golden path used in the recorded demo:

**discovery → composition → preference change → constraint violation → recomposition → new capability → dynamic discovery → four-provider composition → human approval → transactional execution**

1. **Open AgentRep.**

   In Chrome, enable `chrome://flags/#enable-webmcp-testing`; alternatively use ChatGPT’s in-app browser, where WebMCP is enabled for the challenge. Open **https://agentrep-app.vercel.app/** and confirm the top bar reads `WebMCP live · 14 tools`.

   At the beginning of this path, PartyHub, FoodHub, and CakeHub are discoverable. PokemonPartyHub is a real provider site, but it is not yet discoverable through AgentRep.

   The [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) can also call the same tools without ChatGPT.

2. **Give ChatGPT one goal.**

   ```text
   I need to plan my daughter's birthday for 20 guests on 19 September 2026
   with a budget of ₹15,000. Her name is Eva. Please do it using AgentRep.
   ```

   Expected behavior: AgentRep discovers the venue, catering, and cake capabilities; ChatGPT invokes the providers’ WebMCP tools to search, price, and validate a composition. The recorded demo produced this example—not a required deterministic selection:

   | Recorded-demo example | Price |
   |---|---:|
   | Bounce Town venue | ₹5,500 |
   | Kids Party Package | ₹5,400 |
   | Fresh Fruit Cream cake | ₹1,300 |
   | **Total** | **₹12,200 / ₹15,000** |

3. **Change a preference.**

   ```text
   Can I get a chocolate cake instead?
   ```

   Expected behavior: only the cake component changes; the venue and catering stay in the composition. In the recorded demo, ChatGPT selected Pokémon Cake and the total became ₹12,700.

4. **Introduce a real constraint.**

   ```text
   I just spoke to my wife and we are going to have 25 guests.
   ```

   Expected behavior: valid components are preserved, catering can be recalculated, and the 20-serving selected cake becomes invalid. The user should be offered valid cake replacements. This is recomposition, not a restart.

5. **Publish a capability while the task is active.**

   In AgentRep’s discovery UI, click **A new site published — index it**.

   | Before indexing | After indexing |
   |---|---|
   | 3 providers; no discoverable Pokémon entertainment capability | 4 providers; Pokémon entertainment is discoverable |

   The indexing event is **simulated for this demo**. It represents a registry discovering a provider; it does not fabricate the provider. PokemonPartyHub and its WebMCP tools are real running demo components.

6. **Ask for the newly available capability without naming its site.**

   ```text
   Let's go with Rainbow Layer. Also my daughter loves Pokémon — can we add a
   Pokémon entertainment activity? We can increase the budget to ₹20,000.
   ```

   Expected behavior: the user never specifies PokemonPartyHub. AgentRep discovers the newly indexed entertainment capability, and ChatGPT adds it to the **existing** composition. The recorded demo’s successful example was:

   | Recorded-demo composition | Price |
   |---|---:|
   | Bounce Town | ₹5,500 |
   | Kids Party Package | ₹6,300 |
   | Rainbow Layer cake | ₹2,400 |
   | Pikachu Meet & Greet | ₹3,200 |
   | **Total** | **₹17,400 / ₹20,000** |

   This is the key proof point: a capability absent when the task began becomes discoverable and composable mid-task.

7. **Require human approval.**

   ```text
   Let's go ahead and book all.
   ```

   Expected behavior: the system must not immediately transact. AgentRep shows the exact four bookings and total in its approval panel. The person presses **Approve**. Approval is bound to the plan and is single-use; if the plan changes, the approval is invalidated.

8. **Execute the provider transactions.**

   After approval, ChatGPT calls `commit_plan` to obtain the authorized provider actions, invokes each provider’s transactional WebMCP tool, and calls `record_booking` with the returned confirmation reference.

   The following are recorded-demo examples; confirmation IDs are generated dynamically:

   ```text
   PART-P0GE6
   FOOD-015AL
   CAKE-GE3R7
   POKE-YUBRZ
   ```

   **One user goal. Four independent WebMCP providers. A capability that was not available when the task began. One human approval.**

### What this demonstrates

1. Independent websites expose their own domain capabilities through WebMCP.
2. AgentRep discovers capabilities instead of hardcoding one workflow.
3. ChatGPT composes and recomposes capabilities across sites.
4. Changed requirements invalidate only the affected part of a plan.
5. A newly indexed provider can become discoverable mid-task.
6. Irreversible operations remain behind explicit human approval.
7. Transactional provider tools complete the final actions and return confirmations.

---

## From discovery layer to capability registry

**Today:** AgentRep demonstrates discovery across registered WebMCP providers. A new provider can be indexed during an active task, and its capabilities then become discoverable.

**Vision:** an open capability registry for the agentic web, where WebMCP-enabled sites publish machine-readable capabilities and agents find providers based on what they need to accomplish—not because they already know the right URLs.

That global registry does **not** exist in this implementation. The demo uses a local catalogue behind a registry adapter, and simulates the moment PokemonPartyHub is indexed.

---

## How WebMCP is implemented

Every origin is origin-isolated (`Origin-Agent-Cluster: ?1`). Tools register through `document.modelContext.registerTool` via `@agentrep/webmcp`:

```js
document.modelContext.registerTool({
  name: "discover_sites",
  description: "Find WebMCP-enabled websites that can perform part of the user's goal.",
  inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  execute: async (input) => { /* match indexed providers; return url, tools, slot */ },
});
```

Registration lives in `packages/webmcp/src/react.ts` (`registerTools` / `useWebMCPTools`). Provider sites share a five-tool factory in `packages/provider-kit` so shapes are uniform; **descriptions are not**—each provider states its own speciality, which is what the agent matches on.

Cross-origin: the `tools` Permissions-Policy defaults to `self`. AgentRep sets `allow="tools"` on each iframe **and** every provider allowlists the AgentRep origin in `Permissions-Policy: tools=(self "<AGENTREP_ORIGIN>")`. Without both, iframe tools do not appear.

Catalogues are mock and prices are integer paise. Provider indexing is simulated in the UI; provider sites and their tools are real.

---

## AgentRep tools (14)

**Discovery:** `discover_sites` · `get_site_capabilities`

**Board:** `get_plan_state` · `set_event_details` · `add_candidates` · `select_candidate` · `undo_last_change`

**Reasoning support:** `find_savings` · `explain_tradeoff` · `check_plan` · `highlight`

**Gate:** `request_approval` (blocking) · `commit_plan` (returns authorized provider calls; does not book) · `record_booking`

Each provider has five tools: a domain search, detail lookup, availability or delivery check, price lookup, and booking/order action.

`commit_plan` rejects approval tokens that are unknown, used, expired, or whose `planHash` no longer matches (`STALE_APPROVAL`). Editing the board increments `stateVersion` and voids approval.

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

```text
apps/agentrep/          14 tools, board, discovery registry
apps/foodhub/           catering catalogue
apps/partyhub/          venue catalogue
apps/cakehub/           cake catalogue
apps/pokemonpartyhub/   entertainment catalogue
packages/webmcp/        registerTool, envelopes, paise
packages/provider-kit/  five-tool factory + provider UI
```

Five Vercel projects use one `apps/*` root each; separate origins are required. Providers use `AGENTREP_ORIGIN`. AgentRep uses `PROVIDER_ORIGINS` plus `NEXT_PUBLIC_*_URL` for each provider. Headers are build-time, so redeploy all five projects after changing them.

---

## License

MIT. See [LICENSE](./LICENSE).
