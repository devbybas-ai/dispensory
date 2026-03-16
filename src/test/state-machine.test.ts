import { describe, it, expect } from "vitest";
import {
  validateTransition,
  isTerminalState,
  getNextStates,
} from "@/domains/inventory/inventory/state-machine";

describe("Inventory State Machine", () => {
  describe("validateTransition", () => {
    it("allows INBOUND → QUARANTINED", () => {
      const result = validateTransition("INBOUND", "QUARANTINED", "RECEIVED");
      expect(result.valid).toBe(true);
    });

    it("allows INBOUND → AVAILABLE", () => {
      const result = validateTransition("INBOUND", "AVAILABLE", "RECEIVED");
      expect(result.valid).toBe(true);
    });

    it("allows AVAILABLE → RESERVED", () => {
      const result = validateTransition("AVAILABLE", "RESERVED", "SOLD");
      expect(result.valid).toBe(true);
    });

    it("allows RESERVED → PACKED", () => {
      const result = validateTransition("RESERVED", "PACKED", "SOLD");
      expect(result.valid).toBe(true);
    });

    it("allows PACKED → OUT_FOR_DELIVERY", () => {
      const result = validateTransition("PACKED", "OUT_FOR_DELIVERY", "SOLD");
      expect(result.valid).toBe(true);
    });

    it("rejects DESTROYED → any (terminal state)", () => {
      const result = validateTransition("DESTROYED", "AVAILABLE", "AUDIT_CORRECTION");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("terminal state");
    });

    it("rejects AVAILABLE → PACKED (must go through RESERVED)", () => {
      const result = validateTransition("AVAILABLE", "PACKED", "SOLD");
      expect(result.valid).toBe(false);
    });

    it("requires RECALLED reason for RECALLED state", () => {
      const result = validateTransition("AVAILABLE", "RECALLED", "DAMAGED");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("requires reason");
    });

    it("allows AVAILABLE → RECALLED with correct reason", () => {
      const result = validateTransition("AVAILABLE", "RECALLED", "RECALLED");
      expect(result.valid).toBe(true);
    });

    it("requires proper reason for DESTROYED state", () => {
      const result = validateTransition("EXPIRED", "DESTROYED", "SOLD");
      expect(result.valid).toBe(false);
    });

    it("allows EXPIRED → DESTROYED with proper reason", () => {
      const result = validateTransition("EXPIRED", "DESTROYED", "EXPIRED");
      expect(result.valid).toBe(true);
    });
  });

  describe("isTerminalState", () => {
    it("DESTROYED is terminal", () => {
      expect(isTerminalState("DESTROYED")).toBe(true);
    });

    it("AVAILABLE is not terminal", () => {
      expect(isTerminalState("AVAILABLE")).toBe(false);
    });

    it("EXPIRED is not terminal (can still be destroyed)", () => {
      expect(isTerminalState("EXPIRED")).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it("returns correct states for AVAILABLE", () => {
      const next = getNextStates("AVAILABLE");
      expect(next).toContain("RESERVED");
      expect(next).toContain("QUARANTINED");
      expect(next).toContain("RECALLED");
      expect(next).not.toContain("PACKED");
    });

    it("returns empty array for DESTROYED", () => {
      expect(getNextStates("DESTROYED")).toHaveLength(0);
    });
  });
});
