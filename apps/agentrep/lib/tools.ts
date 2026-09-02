"use client";

import { type ToolDefinition, toolOk, toolErr, formatINR } from "@agentrep/webmcp";
import { usePlanStore } from "@/store/planStore";
import { discover, getProvider, allIndexed } from "@/lib/registry";
import { SLOT_LABELS, SLOT_ORDER, type SlotId } from "@/lib/types";

const SLOT_ENUM = { type: "string", enum: SLOT_ORDER } as const;

/**
 * AgentRep's own WebMCP surface.
 *
 * Two responsibilities, deliberately separated:
 *   1. Discovery  — which sites can do this?
 *   2. The board  — hold the plan the agent is assembling, do the
 *                   arithmetic, and gate anything irreversible.
 *
 * What is NOT here: planning. AgentRep never decides what the party
 * should look like, never picks a venue, never books anything. ChatGPT
 * reasons; providers execute; the board remembers and checks.
 */
export function buildAgentRepTools(): ToolDefinition[] {
  const s = () => usePlanStore.getState();
  const env = (extra: Record<string, unknown> = {}) => ({
    stateVersion: s().stateVersion,
    totals: s().deriveTotals(),
    ...extra,
  });

  return [
    // ═══ DISCOVERY ═══════════════════════════════════════════════
    {
      name: "discover_sites",
      description:
        "Find WebMCP-enabled websites that can actually perform part of the " +
        "user's goal. Search engines answer 'where can I read about X'; this " +
        "answers 'which site can do X for me'. Call it once per capability " +
        "you need — one call for venues, another for catering — rather than " +
        "one broad call, because it ranks by keyword overlap and a broad " +
        "query dilutes the match. Returns each site's URL, the tools it " +
        "exposes, and what it is for. Re-run it later in the conversation " +
        "when the user's needs change: the set of indexed sites is not " +
        "fixed, and a capability that was unavailable earlier may exist now.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "What needs doing, in plain words, e.g. \"children's birthday " +
              "venue in Delhi\" or \"themed entertainer for a party\".",
          },
          limit: { type: "integer", minimum: 1, maximum: 8, default: 5 },
        },
        required: ["query"],
        additionalProperties: false,
      },
      execute: async (input: { query: string; limit?: number }) => {
        const hits = discover(input.query, input.limit ?? 5);
        s().setDiscovery(input.query, hits.map((h) => h.name));
        s().log("discover_sites", `"${input.query}" → ${hits.length} provider(s)`, "discovery");

        if (!hits.length) {
          return toolErr(
            "NO_PROVIDERS",
            `No indexed site matches "${input.query}".`,
            "Try a broader phrasing, or a different capability word — " +
              "\"catering\" rather than \"birthday lunch buffet\".",
          );
        }
        return toolOk(
          {
            query: input.query,
            providers: hits.map((h) => ({
              name: h.name, domain: h.domain, url: h.url,
              capability: h.capability, summary: h.summary,
              tools: h.tools, fillsSlot: h.slot, relevance: h.relevance,
            })),
          },
          `${hits.map((h) => h.name).join(", ")} can help with that.`,
          env(),
        );
      },
    },

    {
      name: "get_site_capabilities",
      description:
        "List exactly which WebMCP tools one site exposes and what each is " +
        "for, without visiting it. Use to decide whether a site is worth " +
        "opening before you navigate, and to know which tool to reach for " +
        "when you get there.",
      inputSchema: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Domain or brand name from discover_sites." },
        },
        required: ["domain"],
        additionalProperties: false,
      },
      execute: async (input: { domain: string }) => {
        const p = getProvider(input.domain);
        if (!p) {
          return toolErr(
            "UNKNOWN_PROVIDER",
            `"${input.domain}" is not in the index.`,
            `Indexed sites: ${allIndexed().map((x) => x.domain).join(", ")}.`,
          );
        }
        s().log("get_site_capabilities", p.name, "discovery");
        return toolOk(
          { name: p.name, domain: p.domain, url: p.url, embedUrl: p.embedUrl,
            capability: p.capability, summary: p.summary, tools: p.tools, fillsSlot: p.slot },
          `${p.name} exposes ${p.tools.length} tools for ${p.capability.toLowerCase()}.`,
          env(),
        );
      },
    },

    // ═══ BOARD: READ ═════════════════════════════════════════════
    {
      name: "get_plan_state",
      description:
        "Read the plan board: event details, every slot, all candidates " +
        "gathered so far, what is selected, the running total and any " +
        "outstanding violations. Call this at the start of a planning turn " +
        "and again whenever the user says they changed something — they can " +
        "select and clear items on the board by hand, so your last known " +
        "state may be stale. Compare stateVersion with the value from your " +
        "previous call to detect that.",
      inputSchema: {
        type: "object",
        properties: {
          includeCandidates: { type: "boolean", default: true,
            description: "Set false for a cheap totals-only check." },
          slots: { type: "array", items: SLOT_ENUM,
            description: "Restrict to specific slots. Omit for the whole board." },
        },
        additionalProperties: false,
      },
      execute: async (input: { includeCandidates?: boolean; slots?: SlotId[] }) => {
        const st = s();
        const ids = input?.slots?.length ? input.slots : SLOT_ORDER;
        const slots = ids.map((id) => {
          const slot = st.slots[id];
          return {
            id, label: slot.label, required: slot.required,
            selectedCandidateId: slot.selectedCandidateId,
            selectionReason: slot.selectionReason,
            bookedReference: slot.bookedReference,
            candidateCount: slot.candidates.length,
            candidates: input?.includeCandidates === false ? undefined : slot.candidates,
          };
        });
        const t = st.deriveTotals();
        st.log("get_plan_state", `${t.filledSlots}/${t.totalRequiredSlots} filled`, "read");
        return toolOk(
          { event: st.event, slots, violations: st.validate(), authorised: st.authorised },
          `${t.filledSlots} of ${t.totalRequiredSlots} required slots filled, ` +
            `${formatINR(t.selectedTotalInPaise)} committed.`,
          env(),
        );
      },
    },

    // ═══ BOARD: SETUP ════════════════════════════════════════════
    {
      name: "set_event_details",
      description:
        "Set the parameters of the event: budget, date, guest count, the " +
        "child's age, theme and city. Call this as soon as the user states " +
        "their goal, and again whenever they revise a constraint — 'make it " +
        "under \u20B912,000', 'five more kids are coming'. Changing these re-runs " +
        "validation, so the reply tells you immediately whether the current " +
        "plan still fits. Send only the fields that changed.",
      inputSchema: {
        type: "object",
        properties: {
          occasion: { type: "string" },
          budgetInPaise: { type: "integer", minimum: 0,
            description: "Total budget in paise. \u20B915,000 = 1500000. Always integer paise, never rupees, never a decimal." },
          date: { type: "string", format: "date", description: "ISO date, e.g. 2026-09-12." },
          guestCount: { type: "integer", minimum: 1, maximum: 500 },
          childAge: { type: "integer", minimum: 0, maximum: 21 },
          theme: { type: "string", description: "e.g. \"Pokémon\". Drives theme-match warnings." },
          city: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (input: Record<string, unknown>) => {
        s().setEvent(input as any);
        const v = s().validate();
        s().log("set_event_details", Object.keys(input).join(", "), "write");
        return toolOk(
          { event: s().event, violations: v },
          v.length ? `Updated. ${v.length} issue(s) need attention.` : "Event details updated.",
          env(),
        );
      },
    },

    // ═══ BOARD: CANDIDATES ═══════════════════════════════════════
    {
      name: "add_candidates",
      description:
        "Put options you found on a provider site onto the board. This does " +
        "NOT select them — candidates sit side by side so the user can see " +
        "what you considered, and so later swaps have somewhere to go. Add " +
        "every plausible option you found, not just your favourite: " +
        "find_savings can only work with what is on the board, and a plan " +
        "with one candidate per slot cannot be cut down. Send them in one " +
        "call per slot rather than one per item.",
      inputSchema: {
        type: "object",
        properties: {
          slot: SLOT_ENUM,
          candidates: {
            type: "array", minItems: 1, maxItems: 12,
            items: {
              type: "object",
              properties: {
                id: { type: "string", description:
                  "Stable id as \"<Provider>:<itemId>\", e.g. \"PartyHub:venue-fun-arena\". Re-sending the same id updates that candidate instead of duplicating it, so retries are safe." },
                provider: { type: "string" },
                providerDomain: { type: "string" },
                name: { type: "string" },
                priceInPaise: { type: "integer", minimum: 0 },
                attributes: {
                  type: "object",
                  description:
                    "Comparable facts. Use the SAME keys across candidates in one slot so the board can render a comparison and explain_tradeoff can diff them. Venue: capacity, rating, indoor. Cake: servings, flavour, eggless. Food: includedGuests, courses.",
                  additionalProperties: { type: ["string", "number", "boolean"] },
                },
                sourceTool: { type: "string", description: "Provider tool that returned this, e.g. \"search_venues\"." },
              },
              required: ["id", "provider", "name", "priceInPaise"],
              additionalProperties: false,
            },
          },
        },
        required: ["slot", "candidates"],
        additionalProperties: false,
      },
      execute: async (input: { slot: SlotId; candidates: any[] }) => {
        const added = s().upsertCandidates(input.slot, input.candidates.map((c) => ({
          ...c, providerDomain: c.providerDomain ?? "", attributes: c.attributes ?? {},
        })));
        s().setHighlight({ targets: added.map((c) => ({ kind: "candidate", id: c.id })), intent: "attention" });
        s().log("add_candidates", `${added.length} → ${SLOT_LABELS[input.slot]}`, "write");
        return toolOk(
          { slot: input.slot, added: added.map((c) => c.id) },
          `Added ${added.length} option(s) to ${SLOT_LABELS[input.slot].toLowerCase()}.`,
          env(),
        );
      },
    },

    {
      name: "select_candidate",
      description:
        "Commit one candidate as the choice for its slot, replacing any " +
        "previous selection. This is what moves money onto the running " +
        "total. It books nothing — booking happens only after " +
        "request_approval and commit_plan — so call it freely while " +
        "exploring. Note that selecting anything invalidates a previous " +
        "approval, by design.",
      inputSchema: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
          reason: { type: "string", description:
            "One short line on why this one. Shown on the board beside the selection so the user sees your reasoning without asking." },
        },
        required: ["candidateId"],
        additionalProperties: false,
      },
      execute: async (input: { candidateId: string; reason?: string }) => {
        const c = s().select(input.candidateId, input.reason);
        if (!c) {
          return toolErr(
            "CANDIDATE_NOT_FOUND",
            `No candidate "${input.candidateId}" is on the board.`,
            "Call get_plan_state for current ids, or add_candidates first.",
          );
        }
        s().setHighlight({ targets: [{ kind: "candidate", id: c.id }], intent: "improvement" });
        s().log("select_candidate", `${SLOT_LABELS[c.slot]} = ${c.name}`, "write");
        const t = s().deriveTotals();
        return toolOk(
          { slot: c.slot, selected: c.id, violations: s().validate() },
          `${c.name} selected for ${c.slot}. Total ${formatINR(t.selectedTotalInPaise)}` +
            (t.remainingInPaise !== null ? `, ${formatINR(t.remainingInPaise)} left.` : "."),
          env(),
        );
      },
    },

    // ═══ BOARD: REASONING ════════════════════════════════════════
    {
      name: "find_savings",
      description:
        "Given a target total, search every combination of candidates " +
        "already on the board and return the cheapest ways to reach it, " +
        "ranked by how little quality is given up. Use this the moment the " +
        "user asks to cut the budget. Do not guess at swaps yourself and do " +
        "not go back to the provider sites first — this is exhaustive over " +
        "what you have already gathered, so it will find combinations you " +
        "would miss. Each option lists the exact swaps, the new total and " +
        "what is lost. An empty result means the target is unreachable from " +
        "current candidates, which is your signal to go search providers " +
        "for cheaper items and then retry.",
      inputSchema: {
        type: "object",
        properties: {
          targetTotalInPaise: { type: "integer", minimum: 0 },
          protectedSlots: { type: "array", items: SLOT_ENUM,
            description: "Slots the user said not to touch. Respected strictly." },
          maxOptions: { type: "integer", minimum: 1, maximum: 5, default: 3 },
        },
        required: ["targetTotalInPaise"],
        additionalProperties: false,
      },
      execute: async (input: { targetTotalInPaise: number; protectedSlots?: SlotId[]; maxOptions?: number }) => {
        const options = s().searchSwaps(
          input.targetTotalInPaise, input.protectedSlots ?? [], input.maxOptions ?? 3,
        );
        s().log("find_savings", `target ${formatINR(input.targetTotalInPaise)} → ${options.length} option(s)`, "reason");
        if (!options.length) {
          return toolErr(
            "TARGET_UNREACHABLE",
            `No combination of current candidates reaches ${formatINR(input.targetTotalInPaise)}.`,
            "Search the provider sites for cheaper options, add_candidates, then call find_savings again.",
          );
        }
        s().setHighlight({
          targets: options[0].swaps.map((w) => ({ kind: "slot" as const, id: w.slot })),
          intent: "improvement",
          note: `down to ${formatINR(options[0].newTotalInPaise)}`,
        });
        return toolOk(
          { options },
          `${options.length} way(s) down, cheapest ${formatINR(options[0].newTotalInPaise)}.`,
          env(),
        );
      },
    },

    {
      name: "explain_tradeoff",
      description:
        "Diff two candidates in the same slot across price and every shared " +
        "attribute. Call this before recommending a downgrade so you can " +
        "tell the user precisely what they give up, rather than saying 'a " +
        "cheaper option'. Returns a field-by-field comparison, not prose.",
      inputSchema: {
        type: "object",
        properties: { candidateIdA: { type: "string" }, candidateIdB: { type: "string" } },
        required: ["candidateIdA", "candidateIdB"],
        additionalProperties: false,
      },
      execute: async (input: { candidateIdA: string; candidateIdB: string }) => {
        const d = s().diff(input.candidateIdA, input.candidateIdB);
        if (!d) {
          return toolErr("NOT_COMPARABLE",
            "Those candidates are missing, or belong to different slots.",
            "Only compare two candidates within the same slot.");
        }
        s().setHighlight({
          targets: [{ kind: "candidate", id: input.candidateIdA }, { kind: "candidate", id: input.candidateIdB }],
          intent: "attention",
        });
        s().log("explain_tradeoff", `${d.a.name} vs ${d.b.name}`, "reason");
        return toolOk(d, `Compared on ${d.fields.length} fields.`, env());
      },
    },

    {
      name: "check_plan",
      description:
        "Validate the whole plan and return every violation: over budget, " +
        "empty required slots, missing date, venue capacity below the guest " +
        "count, cake servings below the guest count, theme mismatches. Call " +
        "this before request_approval, always — blocking violations prevent " +
        "approval and you will waste the user's attention asking for it.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => {
        const violations = s().validate();
        const blocking = violations.filter((v) => v.severity === "blocking");
        if (violations.length) {
          s().setHighlight({
            targets: violations.map((v) => ({ kind: "violation" as const, id: v.code })),
            intent: "problem",
          });
        }
        s().log("check_plan", `${blocking.length} blocking, ${violations.length - blocking.length} warning`, "reason");
        return toolOk(
          { violations, canRequestApproval: blocking.length === 0 },
          blocking.length
            ? `${blocking.length} blocking issue(s) to fix first.`
            : "Plan is valid and ready for approval.",
          env(),
        );
      },
    },

    // ═══ BOARD AS AN OUTPUT SURFACE ══════════════════════════════
    {
      name: "highlight",
      description:
        "Draw the user's attention to parts of the board while you explain " +
        "something. Call it immediately BEFORE the sentence it refers to, so " +
        "they are looking at the right place as you speak — highlight the " +
        "food and cake rows, then say 'these two are what push us over " +
        "budget'. This is how you point at things. Use it often. It costs " +
        "nothing and it is what makes the board feel shared rather than " +
        "something you operate behind the user's back.",
      inputSchema: {
        type: "object",
        properties: {
          targets: {
            type: "array", minItems: 1, maxItems: 8,
            items: {
              type: "object",
              properties: {
                kind: { type: "string", enum: ["slot", "candidate", "total", "violation"] },
                id: { type: "string", description: "Slot id, candidate id, or violation code. Omit for kind 'total'." },
              },
              required: ["kind"],
              additionalProperties: false,
            },
          },
          intent: {
            type: "string", enum: ["attention", "problem", "improvement", "removed"],
            default: "attention",
            description: "Colours the highlight: neutral, red for a problem, green for something you are proposing, grey for something being dropped.",
          },
          note: { type: "string", maxLength: 80, description: "Optional short label drawn on the highlight." },
        },
        required: ["targets"],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        s().setHighlight({ targets: input.targets, intent: input.intent ?? "attention", note: input.note });
        return toolOk({ highlighted: input.targets.length }, "");
      },
    },

    // ═══ THE GATE ════════════════════════════════════════════════
    {
      name: "request_approval",
      description:
        "Render the approval panel on the board — full line items, total, " +
        "and which provider each booking goes to — and WAIT for the user to " +
        "press approve or reject. This call blocks until they decide or it " +
        "times out. It is the only way to get the approvalToken that " +
        "commit_plan requires. Never tell the user anything is booked before " +
        "this returns approved. If they edit the board while the panel is " +
        "open the request is invalidated and you must check and ask again.",
      inputSchema: {
        type: "object",
        properties: {
          message: { type: "string", maxLength: 240,
            description: "What you are asking them to approve, in your own words. Shown above the line items." },
          timeoutSeconds: { type: "integer", minimum: 15, maximum: 180, default: 90 },
        },
        required: ["message"],
        additionalProperties: false,
      },
      execute: async (input: { message: string; timeoutSeconds?: number }) => {
        const blocking = s().validate().filter((v) => v.severity === "blocking");
        if (blocking.length) {
          return toolErr(
            "PLAN_INVALID",
            `Cannot ask for approval: ${blocking.map((v) => v.code).join(", ")}.`,
            "Fix the blocking violations from check_plan, then request approval again.",
          );
        }
        s().log("request_approval", "waiting for the user", "gate");
        const r = await s().awaitHumanApproval({
          message: input.message, timeoutSeconds: input.timeoutSeconds ?? 90,
        });
        s().log("request_approval", r.decision, "gate");

        if (r.decision !== "approved") {
          return toolOk(
            { decision: r.decision, reason: r.reason ?? null },
            r.decision === "rejected"
              ? (r.reason === "plan_changed_during_approval"
                  ? "The plan changed while the panel was open, so the approval was voided. Re-check and ask again."
                  : "The user declined. Ask what they want changed.")
              : "The request timed out with no decision.",
            env(),
          );
        }
        return toolOk(
          { decision: "approved", approvalToken: r.token, planHash: r.planHash, expiresAt: r.expiresAt },
          "Approved. Call commit_plan with this token to get the authorised booking actions.",
          env(),
        );
      },
    },

    {
      name: "commit_plan",
      description:
        "Exchange an approval token for the list of booking actions the user " +
        "authorised. AgentRep does not book anything itself — it returns, " +
        "for each slot, which provider site to open and which tool to call " +
        "with which arguments. You then go and make those calls. This " +
        "separation is deliberate: the board holds the decision, the " +
        "provider owns the transaction. The token is single-use and bound to " +
        "the exact plan the user saw, so it is refused if anything changed.",
      inputSchema: {
        type: "object",
        properties: { approvalToken: { type: "string" } },
        required: ["approvalToken"],
        additionalProperties: false,
      },
      execute: async (input: { approvalToken: string }) => {
        const check = s().verifyToken(input.approvalToken);
        if (!check.valid) {
          return toolErr(
            check.reason === "plan_changed" ? "STALE_APPROVAL" : "INVALID_APPROVAL",
            check.reason === "plan_changed"
              ? "The plan changed after the user approved it, so the token is void."
              : `That token is ${check.reason}.`,
            "Call check_plan, then request_approval again for the current plan.",
          );
        }
        s().consumeToken(input.approvalToken);

        const actions = s().selected().map(({ slot, candidate }) => {
          const p = getProvider(candidate.providerDomain || candidate.provider);
          const itemId = candidate.id.includes(":") ? candidate.id.split(":").slice(1).join(":") : candidate.id;
          return {
            slot,
            provider: candidate.provider,
            openUrl: p?.url ?? null,
            tool: p?.tools[4] ?? null,
            arguments: {
              id: itemId,
              date: s().event.date,
              guests: s().event.guestCount ?? undefined,
            },
            priceInPaise: candidate.priceInPaise,
            itemName: candidate.name,
          };
        });
        s().log("commit_plan", `${actions.length} action(s) authorised`, "gate");
        return toolOk(
          { authorisedActions: actions, totalInPaise: s().deriveTotals().selectedTotalInPaise },
          `${actions.length} booking(s) authorised. Call each provider's booking tool, then record_booking here with the reference it returns.`,
          env(),
        );
      },
    },

    {
      name: "record_booking",
      description:
        "Write a provider's confirmation reference back onto the board after " +
        "you have actually booked. Call this once per slot, immediately " +
        "after the provider's booking tool returns, so the board reflects " +
        "reality rather than intent. Without it the user sees an approved " +
        "plan with no confirmations and cannot tell what went through.",
      inputSchema: {
        type: "object",
        properties: {
          slot: SLOT_ENUM,
          reference: { type: "string", description: "The reference the provider returned, e.g. \"PART-3K9XA\"." },
        },
        required: ["slot", "reference"],
        additionalProperties: false,
      },
      execute: async (input: { slot: SlotId; reference: string }) => {
        if (!s().recordBooking(input.slot, input.reference)) {
          return toolErr("NO_SELECTION", `Nothing is selected for ${input.slot}.`,
            "Only record bookings for slots with a selected candidate.");
        }
        s().log("record_booking", `${SLOT_LABELS[input.slot]} · ${input.reference}`, "write");
        return toolOk({ slot: input.slot, reference: input.reference },
          `${SLOT_LABELS[input.slot]} confirmed as ${input.reference}.`, env());
      },
    },

    {
      name: "undo_last_change",
      description:
        "Revert the most recent selection change on the board. Use when the " +
        "user says that was wrong, or to back out of a swap they disliked. " +
        "Cannot undo a recorded booking.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => {
        const label = s().undo();
        if (!label) return toolErr("NOTHING_TO_UNDO", "No reversible change on the stack.");
        s().log("undo_last_change", label, "write");
        return toolOk({ undone: label }, `Reverted: ${label}.`, env());
      },
    },
  ];
}
