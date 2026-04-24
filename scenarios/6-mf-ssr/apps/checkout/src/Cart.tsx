import React from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartProps {
  userId?: string;
  items?: CartItem[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Fully SSR-compatible: pure render based on props, no effects, no browser APIs.
// The same component is rendered server-side by `createMFReactFragment` and
// hydrated client-side by `hydrateWithBridge` (prop streaming from the host).
export function Cart({ userId, items = [] }: CartProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div data-mf-region="cart">
        <h2>Your Cart {userId ? `(${userId})` : ''}</h2>
        <p>Cart is empty.</p>
      </div>
    );
  }

  return (
    <div data-mf-region="cart">
      <h2>Your Cart {userId ? `(${userId})` : ''}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{item.name}</strong> — {formatPrice(item.price)} × {item.quantity}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <strong>Total: {formatPrice(total)}</strong>
      </div>
    </div>
  );
}

export default Cart;
