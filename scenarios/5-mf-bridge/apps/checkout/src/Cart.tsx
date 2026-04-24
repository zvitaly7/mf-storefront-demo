import React, { useEffect, useState } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartProps {
  userId?: string;
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

// Module-scoped hooks that entry.ts wires into the host:
//   - CartAPI.onOrderPlaced     → emit('orderPlaced', {orderId})   remote → host
//   - CartAPI.reset             ← onCommand('reset', …)            host   → remote
export const CartAPI: {
  onOrderPlaced?: (orderId: string) => void;
  reset?: () => void;
} = {};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart({ userId, items, onRemove, onClear }: CartProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    // Host 'reset' command clears the local UI state only.
    // Cart items are owned by the shell — we don't touch them from here.
    CartAPI.reset = () => setNote('');
    return () => {
      CartAPI.reset = undefined;
    };
  }, []);

  const placeOrder = () => {
    const orderId = `ord_${Date.now()}`;
    CartAPI.onOrderPlaced?.(orderId);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
            <button onClick={() => onRemove(item.id)} style={{ marginLeft: '1rem', color: 'red' }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <strong>Total: {formatPrice(total)}</strong>
      </div>
      <input
        placeholder="Order note (local state)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ marginTop: '1rem', display: 'block' }}
      />
      <button onClick={onClear} style={{ marginTop: '1rem', marginRight: '0.5rem' }}>
        Clear cart
      </button>
      <button onClick={placeOrder} style={{ marginTop: '1rem' }}>
        Place Order
      </button>
    </div>
  );
}
