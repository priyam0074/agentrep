export type SlotId = "venue" | "food" | "cake" | "entertainment";

export const SLOT_ORDER: SlotId[] = ["venue", "food", "cake", "entertainment"];

export const SLOT_LABELS: Record<SlotId, string> = {
  venue: "Venue",
  food: "Food",
  cake: "Cake",
  entertainment: "Entertainment",
};

/** Entertainment is genuinely optional — a party without it still works. */
export const SLOT_REQUIRED: Record<SlotId, boolean> = {
  venue: true,
  food: true,
  cake: true,
  entertainment: false,
};

export interface Candidate {
  id: string;
  slot: SlotId;
  provider: string;
  providerDomain: string;
  name: string;
  priceInPaise: number;
  attributes: Record<string, string | number | boolean>;
  sourceTool?: string;
  addedAt: string;
}

export interface Slot {
  id: SlotId;
  label: string;
  required: boolean;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  selectionReason: string | null;
  bookedReference: string | null;
}

export interface EventDetails {
  occasion: string;
  date: string | null;
  guestCount: number | null;
  childAge: number | null;
  theme: string | null;
  city: string | null;
  budgetInPaise: number | null;
}

export type ViolationCode =
  | "OVER_BUDGET"
  | "SLOT_EMPTY"
  | "CAPACITY_SHORTFALL"
  | "SERVINGS_SHORTFALL"
  | "NO_DATE"
  | "THEME_MISMATCH";

export interface Violation {
  code: ViolationCode;
  severity: "blocking" | "warning";
  slots: SlotId[];
  message: string;
  detail: Record<string, number | string>;
}

export interface Totals {
  selectedTotalInPaise: number;
  budgetInPaise: number | null;
  remainingInPaise: number | null;
  filledSlots: number;
  totalRequiredSlots: number;
}

export interface SwapOption {
  rank: number;
  newTotalInPaise: number;
  savingInPaise: number;
  swaps: Array<{
    slot: SlotId;
    fromCandidateId: string | null;
    fromName: string | null;
    toCandidateId: string;
    toName: string;
    deltaInPaise: number;
  }>;
  givesUp: string[];
}

export interface Activity {
  id: number;
  tool: string;
  summary: string;
  kind: "read" | "write" | "reason" | "gate" | "discovery";
  at: number;
}

export interface HighlightState {
  targets: Array<{ kind: "slot" | "candidate" | "total" | "violation"; id?: string }>;
  intent: "attention" | "problem" | "improvement" | "removed";
  note?: string;
  at: number;
}

export interface Receipt {
  slot: SlotId;
  provider: string;
  itemName: string;
  priceInPaise: number;
  reference: string;
}
