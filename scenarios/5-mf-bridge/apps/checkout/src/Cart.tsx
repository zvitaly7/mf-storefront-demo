import React, { useEffect } from 'react';
import { useCartStore } from './store/cartStore';

export interface CartProps {
  userId?: string;
}

// Module-scoped hooks the bridge entry wires into host callbacks.
// Cart invokes these; entry.ts forwards them through emit() / onCommand().
export const CartAPI: {
  onOrderPlaced?: (orderId: string) => void;
  reset?: () => void;
} = {};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart({ userId }: CartProps) {
  const { items, removeItem, clearCart, total } = useCartStore();

  useEffect(() => {
    CartAPI.reset = () => clearCart();
    return () => {
      CartAPI.reset = undefined;
    };
  }, [clearCart]);

  const placeOrder = () => {
    const orderId = `ord_${Date.now()}`;
    clearCart();
    CartAPI.onOrderPlaced?.(orderId);
  };

  if (items.length === 0) {
    return (
      <div>
        <h2>Your Cart {userId ? `(${userId})` : ''}</h2>
        <p>Cart is empty.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Cart {userId ? `(${userId})` : ''}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{item.name}</strong> — {formatPrice(item.price)} × {item.quantity}
            <button onClick={() => removeItem(item.id)} style={{ marginLeft: '1rem', color: 'red' }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <strong>Total: {formatPrice(total())}</strong>
      </div>
      <button onClick={placeOrder} style={{ marginTop: '1rem' }}>
        Place Order
      </button>
    </div>
  );
}
