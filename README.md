# AgentRep

**Your agent represents you on the web.**

Built for [The WebMCP Challenge](https://webmcp.devpost.com/).

AgentRep is two things working together: a **capability discovery layer**
that answers "which website can actually *do* this for me", and a **shared
plan board** where the person and their agent assemble the answer together
and where nothing irreversible happens without a human pressing a button.

Five separate origins, all WebMCP-enabled:

| Site | Role | Tools |
|---|---|---|
| **AgentRep** | Discovery + plan board | 14 |
| **PartyHub** | Venue booking | 5 |
| **FoodHub** | Catering | 5 |
| **CakeHub** | Cake ordering | 5 |
| **PokemonPartyHub** | Themed entertainment | 5 |

---

## The problem

A search engine tells an agent where to *read* about birthday venues. It
does not tell the agent which site can *book* one. WebMCP lets a site
declare its capabilities as structured tools, but the Chrome documentation
names discoverability as an open limitation: a client has to visit a site
to learn whether it has callable tools at all.

So an agent asked to "plan my daughter's birthday for ₹15,000" has no way
to find out that four different sites, between them, can do the whole job.

AgentRep is an experiment in filling that gap — and in what a web page
should look like once an agent is working on it alongside you.

## Responsibility split

```
ChatGPT      understand · reason · decompose · plan · negotiate · decide
   ↓
AgentRep     discover capabilities · hold the plan · check it · gate it
   ↓
Providers    search · price · check availability · book
```

AgentRep never plans. It does not pick a venue, does not decide a budget
split, and does not book anything — `commit_plan` hands the agent a list of
authorised provider tool calls and the agent goes and makes them. What
AgentRep owns is the *state*: the candidates gathered, what is selected,
what it costs, what is wrong with it, and whether a human has said yes.

## What the plan board adds

Discovery alone returns a list of domains. The board is what makes the
collaboration visible and gives the agent something to reason against:

- **Candidates, not just choices.** The agent puts every option it found on
  the board. The user sees what was considered, and swap search has a space
  to work in.
- **`find_savings`** does an exhaustive search over candidate combinations
  when the user says "make it cheaper", ranked by how little quality is
  given up. This is work the agent cannot do by clicking.
- **`highlight`** lets the agent point at things. It calls it just before
  the sentence it refers to, so the right rows light up while it explains.
  The page becomes an output surface, not just something to operate.
- **The user can edit too.** Clicking a candidate changes the plan and
  bumps `stateVersion`, which the agent checks — and which voids any
  approval token issued before the edit.

## Human approval

`request_approval` renders a panel with full line items and **blocks** —
the promise it returns resolves only when the user presses a button, or on
timeout. It is the only source of the `approvalToken` that `commit_plan`
requires. The token is single-use, expires in five minutes, and is bound to
a hash of the exact plan the user saw. Change anything and it is refused
with `STALE_APPROVAL`.

Provider booking tools carry the same warning in their own descriptions and
are idempotent per item and date, so a retry cannot double-book.

## Multi-origin findings

WebMCP tools belong to the document that registered them, which raises a
real question for any multi-site task: when the agent navigates from
PartyHub to CakeHub, what happens to PartyHub's tools?

AgentRep embeds the provider sites instead of navigating between them. The
`tools` Permissions Policy defaults to `self`, so a cross-origin iframe
cannot register tools unless the parent passes `allow="tools"` **and** the
child allowlists the parent origin in its own `Permissions-Policy` header.
Both are set here. The result is one tab in which four origins' tools
coexist, with no handoff and nothing forgotten mid-plan.

> **Findings from testing in ChatGPT's in-app browser and Chrome
> `--enable-webmcp-testing` go here.** Record what actually happened for
> navigation vs iframes; it is the most useful thing this project can tell
> other people building on the spec.

Every provider also runs standalone, so if a browser does not honour the
iframe path the sites remain fully usable on their own.

## Running locally

Requires Node 20+, pnpm 9+, and Chrome with
`chrome://flags/#enable-webmcp-testing` set to **Enabled**.

```bash
pnpm install

pnpm dev:agentrep          # http://localhost:3000
pnpm dev:partyhub          # http://localhost:3001
pnpm dev:cakehub           # http://localhost:3002
pnpm dev:foodhub           # http://localhost:3003
pnpm dev:pokemonpartyhub   # http://localhost:3004
```

Confirm the wiring before anything else — open any of them and check
`document.modelContext` is defined in the console. If it is `undefined`,
the `Origin-Agent-Cluster: ?1` header is not arriving; WebMCP only runs in
origin-isolated documents.

The [Model Context Tool Inspector extension](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
is much faster than round-tripping ChatGPT while developing: it lists
registered tools, calls them manually, and shows what your JSON Schema
actually parsed to.

## Deploying

Five Vercel projects from this one repo, each with **Root Directory** set
to its own `apps/*` folder. Separate projects give separate origins, which
the architecture depends on.

Then set environment variables:

- On **each provider**: `AGENTREP_ORIGIN` = the deployed AgentRep URL.
  This lands in their `Permissions-Policy` and `frame-ancestors`.
- On **AgentRep**: `PROVIDER_ORIGINS` (space-separated) plus
  `NEXT_PUBLIC_PARTYHUB_URL`, `NEXT_PUBLIC_CAKEHUB_URL`,
  `NEXT_PUBLIC_FOODHUB_URL`, `NEXT_PUBLIC_POKEMONPARTYHUB_URL`.

Redeploy all five after setting them — the headers are generated at build.

## Repository layout

```
packages/webmcp/        registerTool wrapper, React binding, response
                        envelope, integer-paise money helpers
packages/provider-kit/  shared provider UI + the five-tool factory
apps/agentrep/          discovery registry, plan store, 14 tools, board UI
apps/partyhub/          venue catalogue + config
apps/foodhub/           catering catalogue + config
apps/cakehub/           cake catalogue + config
apps/pokemonpartyhub/   entertainment catalogue + config
```

The provider sites share a tool factory because their tool *shapes* should
be uniform — an agent that has used one can predict the next. Their tool
*descriptions* are not uniform: each states its site's real speciality,
because that is what the agent matches against when deciding where to go.

## Demo script

1. "Plan my daughter's 7th birthday on 12 September for 15 kids, budget
   ₹15,000, Pokémon theme — use AgentRep."
2. The agent calls `discover_sites` per capability, gets PartyHub, FoodHub
   and CakeHub, and reads their tool lists.
3. It searches each provider, puts every option it found on the board with
   `add_candidates`, and selects a plan. Total: **₹13,300**.
4. "Can you bring it under ₹12,000?" → `find_savings` returns ranked swaps.
   The agent highlights the rows it is proposing to change and explains
   what each costs in quality.
5. `check_plan`, then `request_approval`. The panel blocks. The user
   presses approve.
6. `commit_plan` returns authorised actions; the agent books at each
   provider and writes the references back with `record_booking`.
7. **A new site is indexed mid-conversation.** "Actually, make the
   entertainment Pokémon themed." `discover_sites` now returns
   PokemonPartyHub. No change to the agent, no change to AgentRep's code —
   a new capability simply became available on the web.

The control that indexes PokemonPartyHub is labelled in the UI as a demo
control. The site itself is real and running; only the moment of indexing
is simulated.

## Data

All catalogues are deterministic mock data. No payments, no accounts, no
real merchants. Prices are integer paise throughout — a float in a budget
demo will embarrass you live.

## License

MIT. See [LICENSE](./LICENSE).
