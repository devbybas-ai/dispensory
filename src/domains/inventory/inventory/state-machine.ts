import type { InventoryState, AdjustmentReason } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Inventory State Machine
// Defines valid state transitions and required reasons
// ─────────────────────────────────────────────────────────────

/** Valid transitions: fromState → [allowed toStates] */
const STATE_TRANSITIONS: Record<InventoryState, readonly InventoryState[]> = {
  INBOUND: ["QUARANTINED", "AVAILABLE", "DESTROYED"],
  QUARANTINED: ["AVAILABLE", "RETURNED", "DESTROYED", "RECALLED"],
  AVAILABLE: ["RESERVED", "QUARANTINED", "DESTROYED", "RECALLED", "EXPIRED"],
  RESERVED: ["AVAILABLE", "PACKED", "QUARANTINED"],
  PACKED: ["OUT_FOR_DELIVERY", "AVAILABLE"],
  OUT_FOR_DELIVERY: ["RETURNED", "DESTROYED"],
  RETURNED: ["QUARANTINED", "AVAILABLE", "DESTROYED"],
  DESTROYED: [],
  RECALLED: ["QUARANTINED", "DESTROYED"],
  EXPIRED: ["DESTROYED"],
};

/** Required reasons for specific transitions */
const REQUIRED_REASONS: Partial<Record<InventoryState, readonly AdjustmentReason[]>> = {
  DESTROYED: ["DAMAGED", "EXPIRED", "RECALLED", "DESTROYED", "OTHER"],
  RETURNED: ["RETURNED_BY_CUSTOMER", "RETURNED_TO_VENDOR", "OTHER"],
  RECALLED: ["RECALLED"],
  EXPIRED: ["EXPIRED"],
};

export interface TransitionValidation {
  valid: boolean;
  error?: string;
}

/** Check if a state transition is valid. */
export function validateTransition(
  fromState: InventoryState,
  toState: InventoryState,
  reason: AdjustmentReason
): TransitionValidation {
  const allowed = STATE_TRANSITIONS[fromState];
  if (!allowed.includes(toState)) {
    return {
      valid: false,
      error: `Invalid transition: ${fromState} → ${toState}. Allowed: ${allowed.join(", ") || "none (terminal state)"}`,
    };
  }

  const requiredReasons = REQUIRED_REASONS[toState];
  if (requiredReasons && !requiredReasons.includes(reason)) {
    return {
      valid: false,
      error: `Transition to ${toState} requires reason: ${requiredReasons.join(", ")}. Got: ${reason}`,
    };
  }

  return { valid: true };
}

/** Check if a state is terminal (no further transitions possible). */
export function isTerminalState(state: InventoryState): boolean {
  return STATE_TRANSITIONS[state].length === 0;
}

/** Get all valid next states from a given state. */
export function getNextStates(state: InventoryState): readonly InventoryState[] {
  return STATE_TRANSITIONS[state];
}
