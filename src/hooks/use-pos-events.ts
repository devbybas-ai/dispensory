"use client";

import { useEffect } from "react";
import { useSocket } from "@/lib/realtime/client";

// === TYPED POS EVENT HOOK ===
// Provides a type-safe interface for subscribing to POS real-time events.
// Events are scoped to the user's premises room via Socket.io.

interface NewOrderData {
  orderId: string;
  orderNumber: string;
  cashierName: string;
  totalAmount: number;
  lineCount: number;
  timestamp: string;
}

interface OrderCompletedData {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  cashierName: string;
  timestamp: string;
}

interface OrderVoidedData {
  orderId: string;
  orderNumber: string;
  voidReason: string;
  voidedBy: string;
  originalAmount: number;
  timestamp: string;
}

interface ShiftChangeData {
  shiftId: string;
  userId: string;
  userName: string;
  action: "opened" | "closed" | "reconciled";
  premisesId: string;
  timestamp: string;
}

interface POSEventHandlers {
  onNewOrder?: (data: NewOrderData) => void;
  onOrderCompleted?: (data: OrderCompletedData) => void;
  onOrderVoided?: (data: OrderVoidedData) => void;
  onShiftChange?: (data: ShiftChangeData) => void;
}

/**
 * Subscribe to real-time POS events.
 * Automatically connects to the /pos namespace and registers event listeners.
 * Cleans up listeners on unmount.
 *
 * @param handlers - Callback handlers for each POS event type
 */
export function usePOSEvents(handlers: POSEventHandlers): void {
  const { socket } = useSocket("/pos");

  useEffect(() => {
    if (!socket) return;

    if (handlers.onNewOrder) {
      socket.on("new-order", handlers.onNewOrder);
    }
    if (handlers.onOrderCompleted) {
      socket.on("order-completed", handlers.onOrderCompleted);
    }
    if (handlers.onOrderVoided) {
      socket.on("order-voided", handlers.onOrderVoided);
    }
    if (handlers.onShiftChange) {
      socket.on("shift-change", handlers.onShiftChange);
    }

    return () => {
      if (handlers.onNewOrder) {
        socket.off("new-order", handlers.onNewOrder);
      }
      if (handlers.onOrderCompleted) {
        socket.off("order-completed", handlers.onOrderCompleted);
      }
      if (handlers.onOrderVoided) {
        socket.off("order-voided", handlers.onOrderVoided);
      }
      if (handlers.onShiftChange) {
        socket.off("shift-change", handlers.onShiftChange);
      }
    };
  }, [socket, handlers]);
}
