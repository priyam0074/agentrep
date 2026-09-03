"use client";

import { create } from "zustand";
import {
  SLOT_LABELS, SLOT_ORDER, SLOT_REQUIRED,
  type Activity, type Candidate, type DiscoveryMatch, type DiscoveryState,
  type EventDetails, type HighlightState,
  type Receipt, type Slot, type SlotId, type SwapOption, type Totals,
  type Violation,
} from "@/lib/types";
import { candidateConflictsWithCity, sameCity } from "@/lib/city";

interface TokenRecord { planHash: string; expiresAt: number; used: boolean; }

interface PendingApproval {
  message: string;
  lineItems: Array<{ slot: SlotId; label: string; name: string; provider: string; priceInPaise: number }>;
  totalInPaise: number;
  decide: (decision: "approved" | "rejected", reason?: string) => void;
}

interface UndoEntry { label: string; restore: () => void; }

const emptySlots = (): Record<SlotId, Slot> =>
  Object.fromEntries(
    SLOT_ORDER.map((id) => [id, {
      id, label: SLOT_LABELS[id], required: SLOT_REQUIRED[id],
      candidates: [], selectedCandidateId: null, selectionReason: null,
      bookedReference: null,
    } as Slot]),
  ) as Record<SlotId, Slot>;

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

interface PlanState {
  stateVersion: number;
  event: EventDetails;
  slots: Record<SlotId, Slot>;
  activity: Activity[];
  highlight: HighlightState | null;
  pendingApproval: PendingApproval | null;
  authorised: boolean;
  receipts: Receipt[];
  discovery: DiscoveryState | null;
  tokens: Record<string, TokenRecord>;
  undoStack: UndoEntry[];

  log: (tool: string, summary: string, kind: Activity["kind"]) => void;
  setDiscovery: (query: string, hits: DiscoveryMatch[]) => void;
  setEvent: (patch: Partial<EventDetails>) => void;
  upsertCandidates: (slot: SlotId, incoming: Array<Omit<Candidate, "slot" | "addedAt">>) => Candidate[];
  select: (candidateId: string, reason?: string) => Candidate | null;
  findCandidate: (id: string) => Candidate | undefined;
  selected: () => Array<{ slot: SlotId; candidate: Candidate }>;
  deriveTotals: () => Totals;
  validate: () => Violation[];
  searchSwaps: (target: number, protectedSlots: SlotId[], max: number) => SwapOption[];
  diff: (a: string, b: string) => { slot: SlotId; a: any; b: any; fields: any[] } | null;
  setHighlight: (h: Omit<HighlightState, "at">) => void;
  awaitHumanApproval: (opts: { message: string; timeoutSeconds: number }) =>
    Promise<{ decision: "approved" | "rejected" | "timeout"; reason?: string; token?: string; planHash?: string; expiresAt?: number }>;
  resolveApproval: (decision: "approved" | "rejected") => void;
  planHash: () => string;
  verifyToken: (token: string) => { valid: boolean; reason?: string };
  consumeToken: (token: string) => void;
  recordBooking: (slot: SlotId, reference: string) => boolean;
  undo: () => string | null;
  reset: () => void;
}

let activityId = 0;

export const usePlanStore = create<PlanState>((set, get) => ({
  stateVersion: 1,
  event: {
    occasion: "Untitled plan", date: null, guestCount: null,
    childAge: null, theme: null, city: null, budgetInPaise: null,
  },
  slots: emptySlots(),
  activity: [],
  highlight: null,
  pendingApproval: null,
  authorised: false,
  receipts: [],
  discovery: null,
  tokens: {},
  undoStack: [],

  log: (tool, summary, kind) =>
    set((s) => ({ activity: [{ id: ++activityId, tool, summary, kind, at: Date.now() }, ...s.activity].slice(0, 40) })),

  setDiscovery: (query, hits) =>
    set({
      discovery: {
        query,
        providers: hits.map((h) => h.name),
        hits,
        at: Date.now(),
      },
    }),

  setEvent: (patch) =>
    set((s) => {
      const event = { ...s.event, ...patch };
      const cityChanged = patch.city !== undefined && !sameCity(s.event.city, event.city);
      if (!cityChanged) {
        return { event, stateVersion: s.stateVersion + 1 };
      }

      const venue = s.slots.venue;
      const kept = event.city?.trim()
        ? venue.candidates.filter((c) => !candidateConflictsWithCity(c.attributes, event.city))
        : venue.candidates;
      const selectedGone =
        venue.selectedCandidateId != null &&
        !kept.some((c) => c.id === venue.selectedCandidateId);

      return {
        event,
        stateVersion: s.stateVersion + 1,
        authorised: selectedGone ? false : s.authorised,
        slots: {
          ...s.slots,
          venue: {
            ...venue,
            candidates: kept,
            selectedCandidateId: selectedGone ? null : venue.selectedCandidateId,
            selectionReason: selectedGone ? null : venue.selectionReason,
            bookedReference: selectedGone ? null : venue.bookedReference,
          },
        },
      };
    }),

  upsertCandidates: (slot, incoming) => {
    const now = new Date().toISOString();
    const city = get().event.city;
    const accepted = slot === "venue" && city?.trim()
      ? incoming.filter((c) => !candidateConflictsWithCity(c.attributes, city))
      : incoming;
    const built: Candidate[] = accepted.map((c) => ({ ...c, slot, addedAt: now }));
    set((s) => {
      const existing = s.slots[slot].candidates;
      const byId = new Map(existing.map((c) => [c.id, c]));
      for (const c of built) byId.set(c.id, c);
      return {
        slots: { ...s.slots, [slot]: { ...s.slots[slot], candidates: [...byId.values()] } },
        stateVersion: s.stateVersion + 1,
      };
    });
    return built;
  },

  findCandidate: (id) => {
    for (const slot of SLOT_ORDER) {
      const c = get().slots[slot].candidates.find((x) => x.id === id);
      if (c) return c;
    }
    return undefined;
  },

  select: (candidateId, reason) => {
    const c = get().findCandidate(candidateId);
    if (!c) return null;
    const prev = get().slots[c.slot];
    const prevId = prev.selectedCandidateId;
    const prevReason = prev.selectionReason;
    set((s) => ({
      slots: {
        ...s.slots,
        [c.slot]: { ...s.slots[c.slot], selectedCandidateId: c.id, selectionReason: reason ?? null },
      },
      stateVersion: s.stateVersion + 1,
      authorised: false, // any change invalidates a prior authorisation
      undoStack: [
        { label: `select ${c.name}`, restore: () => set((st) => ({
            slots: { ...st.slots, [c.slot]: { ...st.slots[c.slot], selectedCandidateId: prevId, selectionReason: prevReason } },
            stateVersion: st.stateVersion + 1,
          })) },
        ...s.undoStack,
      ].slice(0, 20),
    }));
    return c;
  },

  selected: () =>
    SLOT_ORDER.flatMap((slot) => {
      const s = get().slots[slot];
      const c = s.candidates.find((x) => x.id === s.selectedCandidateId);
      return c ? [{ slot, candidate: c }] : [];
    }),

  deriveTotals: () => {
    const sel = get().selected();
    const total = sel.reduce((n, x) => n + x.candidate.priceInPaise, 0);
    const budget = get().event.budgetInPaise;
    return {
      selectedTotalInPaise: total,
      budgetInPaise: budget,
      remainingInPaise: budget === null ? null : budget - total,
      filledSlots: sel.filter((x) => SLOT_REQUIRED[x.slot]).length,
      totalRequiredSlots: SLOT_ORDER.filter((s) => SLOT_REQUIRED[s]).length,
    };
  },

  validate: () => {
    const { event, slots } = get();
    const t = get().deriveTotals();
    const v: Violation[] = [];

    if (t.budgetInPaise !== null && t.selectedTotalInPaise > t.budgetInPaise) {
      v.push({
        code: "OVER_BUDGET", severity: "blocking",
        slots: get().selected().map((s) => s.slot),
        message: `The plan is over budget by \u20B9${Math.round((t.selectedTotalInPaise - t.budgetInPaise) / 100).toLocaleString("en-IN")}.`,
        detail: { overByInPaise: t.selectedTotalInPaise - t.budgetInPaise },
      });
    }

    for (const id of SLOT_ORDER) {
      if (SLOT_REQUIRED[id] && !slots[id].selectedCandidateId) {
        v.push({
          code: "SLOT_EMPTY", severity: "blocking", slots: [id],
          message: `No ${SLOT_LABELS[id].toLowerCase()} chosen yet.`,
          detail: { slot: id, candidatesAvailable: slots[id].candidates.length },
        });
      }
    }

    if (!event.date) {
      v.push({
        code: "NO_DATE", severity: "blocking", slots: [],
        message: "The event has no date, so nothing can be booked.",
        detail: {},
      });
    }

    const guests = event.guestCount ?? 0;
    if (guests) {
      for (const { slot, candidate } of get().selected()) {
        const cap = Number(candidate.attributes.capacity ?? 0);
        if (cap && cap < guests) {
          v.push({
            code: "CAPACITY_SHORTFALL", severity: "blocking", slots: [slot],
            message: `${candidate.name} holds ${cap} people but ${guests} are coming.`,
            detail: { capacity: cap, guests },
          });
        }
        const servings = Number(candidate.attributes.servings ?? 0);
        if (servings && servings < guests) {
          v.push({
            code: "SERVINGS_SHORTFALL", severity: "warning", slots: [slot],
            message: `${candidate.name} serves ${servings}, short of ${guests} guests.`,
            detail: { servings, guests },
          });
        }
      }
    }

    if (event.theme) {
      const theme = event.theme.toLowerCase();
      for (const { slot, candidate } of get().selected()) {
        // Absence of theme information is "unknown", not a mismatch. Only
        // warn when the candidate actually declares themes and none match,
        // otherwise every plain item raises a false alarm.
        const declared = String(
          candidate.attributes.themes ?? candidate.attributes.theme ?? "",
        ).toLowerCase();
        if (!declared) continue;
        const text = declared + " " + candidate.name.toLowerCase();
        if (slot !== "food" && !text.includes(theme)) {
          v.push({
            code: "THEME_MISMATCH", severity: "warning", slots: [slot],
            message: `${candidate.name} is not ${event.theme}-themed.`,
            detail: { slot, theme: event.theme },
          });
        }
      }
    }
    return v;
  },

  /**
   * Exhaustive search over candidate combinations. With four slots and a
   * dozen candidates each this is a few thousand combinations — brute
   * force is both fast enough and easier to trust than a heuristic.
   */
  searchSwaps: (target, protectedSlots, max) => {
    const { slots } = get();
    const current = new Map(get().selected().map((s) => [s.slot, s.candidate]));

    const axes = SLOT_ORDER.map((slot) => {
      const cur = current.get(slot) ?? null;
      if (protectedSlots.includes(slot) || !cur) return [cur];
      const options = slots[slot].candidates.slice();
      if (!options.some((o) => o.id === cur.id)) options.push(cur);
      return options as Array<Candidate | null>;
    });

    const combos: Array<Array<Candidate | null>> = [[]];
    for (const axis of axes) {
      const next: Array<Array<Candidate | null>> = [];
      for (const combo of combos) for (const opt of axis) next.push([...combo, opt]);
      combos.length = 0; combos.push(...next);
      if (combos.length > 20000) break; // safety valve
    }

    const currentTotal = get().deriveTotals().selectedTotalInPaise;
    const quality = (c: Candidate) =>
      Number(c.attributes.rating ?? 0) * 2 +
      Number(c.attributes.courses ?? 0) +
      Number(c.attributes.servings ?? 0) / 10 +
      Number(c.attributes.capacity ?? 0) / 10;

    const scored = combos
      .map((combo) => {
        const total = combo.reduce((n, c) => n + (c?.priceInPaise ?? 0), 0);
        const swaps = combo.flatMap((c, i) => {
          const slot = SLOT_ORDER[i];
          const cur = current.get(slot) ?? null;
          if (!c || !cur || c.id === cur.id) return [];
          return [{
            slot, fromCandidateId: cur.id, fromName: cur.name,
            toCandidateId: c.id, toName: c.name,
            deltaInPaise: c.priceInPaise - cur.priceInPaise,
          }];
        });
        const lost = combo.flatMap((c, i) => {
          const cur = current.get(SLOT_ORDER[i]) ?? null;
          if (!c || !cur || c.id === cur.id) return [];
          const d = quality(cur) - quality(c);
          return d > 0 ? [`${cur.name} \u2192 ${c.name}`] : [];
        });
        return { total, swaps, lost, qualityLost: combo.reduce((n, c, i) => {
          const cur = current.get(SLOT_ORDER[i]) ?? null;
          return n + (c && cur ? Math.max(0, quality(cur) - quality(c)) : 0);
        }, 0) };
      })
      .filter((x) => x.total <= target && x.swaps.length > 0)
      .sort((a, b) => a.qualityLost - b.qualityLost || b.total - a.total);

    const seen = new Set<string>();
    const out: SwapOption[] = [];
    for (const s of scored) {
      const key = s.swaps.map((w) => w.toCandidateId).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        rank: out.length + 1,
        newTotalInPaise: s.total,
        savingInPaise: currentTotal - s.total,
        swaps: s.swaps,
        givesUp: s.lost,
      });
      if (out.length >= max) break;
    }
    return out;
  },

  diff: (aId, bId) => {
    const a = get().findCandidate(aId);
    const b = get().findCandidate(bId);
    if (!a || !b || a.slot !== b.slot) return null;
    const keys = [...new Set([...Object.keys(a.attributes), ...Object.keys(b.attributes)])];
    const fields = [
      { field: "price", a: a.priceInPaise, b: b.priceInPaise, deltaInPaise: b.priceInPaise - a.priceInPaise },
      ...keys.map((k) => ({ field: k, a: a.attributes[k] ?? null, b: b.attributes[k] ?? null })),
    ];
    return {
      slot: a.slot,
      a: { id: a.id, name: a.name, provider: a.provider },
      b: { id: b.id, name: b.name, provider: b.provider },
      fields,
    };
  },

  setHighlight: (h) => set({ highlight: { ...h, at: Date.now() } }),

  planHash: () => {
    const sel = get().selected().map((s) => `${s.slot}:${s.candidate.id}:${s.candidate.priceInPaise}`);
    return hash(sel.join("|") + "#" + (get().event.budgetInPaise ?? "") + "#" + (get().event.date ?? ""));
  },

  awaitHumanApproval: ({ message, timeoutSeconds }) => {
    const versionAtRequest = get().stateVersion;
    const sel = get().selected();
    const lineItems = sel.map(({ slot, candidate }) => ({
      slot, label: SLOT_LABELS[slot], name: candidate.name,
      provider: candidate.provider, priceInPaise: candidate.priceInPaise,
    }));
    const totalInPaise = get().deriveTotals().selectedTotalInPaise;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        set({ pendingApproval: null });
        resolve({ decision: "timeout" });
      }, timeoutSeconds * 1000);

      const decide = (decision: "approved" | "rejected", reason?: string) => {
        clearTimeout(timer);
        set({ pendingApproval: null });
        if (decision !== "approved") return resolve({ decision, reason });

        // The user may have edited the board while the panel was open.
        if (get().stateVersion !== versionAtRequest) {
          return resolve({ decision: "rejected", reason: "plan_changed_during_approval" });
        }
        const token = "apv_" + Math.random().toString(36).slice(2, 12);
        const expiresAt = Date.now() + 5 * 60 * 1000;
        set((s) => ({
          tokens: { ...s.tokens, [token]: { planHash: get().planHash(), expiresAt, used: false } },
          authorised: true,
        }));
        resolve({ decision: "approved", token, planHash: get().planHash(), expiresAt });
      };

      set({ pendingApproval: { message, lineItems, totalInPaise, decide } });
    });
  },

  resolveApproval: (decision) => get().pendingApproval?.decide(decision),

  verifyToken: (token) => {
    const rec = get().tokens[token];
    if (!rec) return { valid: false, reason: "unknown" };
    if (rec.used) return { valid: false, reason: "already_used" };
    if (Date.now() > rec.expiresAt) return { valid: false, reason: "expired" };
    if (rec.planHash !== get().planHash()) return { valid: false, reason: "plan_changed" };
    return { valid: true };
  },

  consumeToken: (token) =>
    set((s) => ({ tokens: { ...s.tokens, [token]: { ...s.tokens[token], used: true } } })),

  recordBooking: (slot, reference) => {
    const s = get().slots[slot];
    const c = s.candidates.find((x) => x.id === s.selectedCandidateId);
    if (!c) return false;
    set((st) => ({
      slots: { ...st.slots, [slot]: { ...st.slots[slot], bookedReference: reference } },
      receipts: [...st.receipts, {
        slot, provider: c.provider, itemName: c.name,
        priceInPaise: c.priceInPaise, reference,
      }],
    }));
    return true;
  },

  undo: () => {
    const [top, ...rest] = get().undoStack;
    if (!top) return null;
    top.restore();
    set({ undoStack: rest });
    return top.label;
  },

  reset: () => set({
    slots: emptySlots(), receipts: [], activity: [], highlight: null,
    authorised: false, tokens: {}, undoStack: [], discovery: null,
    stateVersion: get().stateVersion + 1,
  }),
}));
