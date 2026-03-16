// ─────────────────────────────────────────────────────────────
// POS Cart Reducer
// Pure state management for the point-of-sale cart.
// No side effects -- all tax calculation happens in the UI layer.
// ─────────────────────────────────────────────────────────────

export interface CartItem {
  packageId: string;
  productName: string;
  brand: string;
  category: string;
  metrcUid: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  customerType: "ADULT_USE" | "MEDICINAL";
  subtotal: number;
}

type AddItemPayload = Omit<CartItem, "lineTotal">;

type CartAction =
  | { type: "ADD_ITEM"; payload: AddItemPayload }
  | { type: "UPDATE_QUANTITY"; payload: { packageId: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { packageId: string } }
  | {
      type: "SET_CUSTOMER";
      payload: { id: string; name: string; type: "ADULT_USE" | "MEDICINAL" };
    }
  | { type: "CLEAR_CUSTOMER" }
  | { type: "CLEAR_CART" };

export const initialCartState: CartState = {
  items: [],
  customerId: undefined,
  customerName: undefined,
  customerType: "ADULT_USE",
  subtotal: 0,
};

/** Round to 2 decimal places (currency). */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Recalculate subtotal from all item line totals. */
function recalcSubtotal(items: CartItem[]): number {
  return roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { payload } = action;
      const existingIndex = state.items.findIndex(
        (item) => item.packageId === payload.packageId
      );

      let nextItems: CartItem[];

      if (existingIndex >= 0) {
        // Item already in cart -- increment quantity, capped at maxQuantity
        nextItems = state.items.map((item, index) => {
          if (index !== existingIndex) return item;
          const newQuantity = Math.min(item.quantity + 1, item.maxQuantity);
          return {
            ...item,
            quantity: newQuantity,
            lineTotal: roundCurrency(item.unitPrice * newQuantity),
          };
        });
      } else {
        // New item -- add with quantity 1 (capped at maxQuantity)
        const quantity = Math.min(1, payload.maxQuantity);
        nextItems = [
          ...state.items,
          {
            ...payload,
            quantity,
            lineTotal: roundCurrency(payload.unitPrice * quantity),
          },
        ];
      }

      return {
        ...state,
        items: nextItems,
        subtotal: recalcSubtotal(nextItems),
      };
    }

    case "UPDATE_QUANTITY": {
      const { packageId, quantity } = action.payload;
      const clamped = Math.max(0, quantity);

      // If quantity is 0, remove the item
      if (clamped === 0) {
        const nextItems = state.items.filter(
          (item) => item.packageId !== packageId
        );
        return {
          ...state,
          items: nextItems,
          subtotal: recalcSubtotal(nextItems),
        };
      }

      const nextItems = state.items.map((item) => {
        if (item.packageId !== packageId) return item;
        const newQuantity = Math.min(clamped, item.maxQuantity);
        return {
          ...item,
          quantity: newQuantity,
          lineTotal: roundCurrency(item.unitPrice * newQuantity),
        };
      });

      return {
        ...state,
        items: nextItems,
        subtotal: recalcSubtotal(nextItems),
      };
    }

    case "REMOVE_ITEM": {
      const nextItems = state.items.filter(
        (item) => item.packageId !== action.payload.packageId
      );
      return {
        ...state,
        items: nextItems,
        subtotal: recalcSubtotal(nextItems),
      };
    }

    case "SET_CUSTOMER": {
      return {
        ...state,
        customerId: action.payload.id,
        customerName: action.payload.name,
        customerType: action.payload.type,
      };
    }

    case "CLEAR_CUSTOMER": {
      return {
        ...state,
        customerId: undefined,
        customerName: undefined,
        customerType: "ADULT_USE",
      };
    }

    case "CLEAR_CART": {
      return { ...initialCartState };
    }

    default: {
      return state;
    }
  }
}

export type { CartAction };
