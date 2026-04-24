import React, { createContext, useContext, useReducer, useMemo } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

type CartAction =
  | { type: 'add'; product: { id: string; name: string; price: number } }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

function reducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const existing = items.find((i) => i.id === action.product.id);
      if (existing) {
        return items.map((i) =>
          i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...items, { ...action.product, quantity: 1 }];
    }
    case 'remove':
      return items.filter((i) => i.id !== action.id);
    case 'clear':
      return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Cart state is owned by the shell and streamed to checkout via MFBridgeLazy
// props. Shell-internal, so React Context is sufficient — no need for
// cross-MF state sharing.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (product) => dispatch({ type: 'add', product }),
      removeItem: (id) => dispatch({ type: 'remove', id }),
      clearCart: () => dispatch({ type: 'clear' }),
    }),
    [items]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartStore(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartStore must be used inside <CartProvider>');
  return ctx;
}
