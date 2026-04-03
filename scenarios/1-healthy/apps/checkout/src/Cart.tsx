import React from 'react';
import { useCartStore } from './store/cartStore';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div>
        <h2>Your Cart</h2>
        <p>Cart is empty.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Cart</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{item.name}</strong> — {formatPrice(item.price)}
            <div style={{ marginTop: '0.25rem' }}>
              <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</button>
              <span style={{ margin: '0 0.5rem' }}>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              <button onClick={() => removeItem(item.id)} style={{ marginLeft: '1rem', color: 'red' }}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <strong>Total: {formatPrice(total())}</strong>
      </div>
      <button onClick={clearCart} style={{ marginTop: '1rem' }}>
        Clear Cart
      </button>
    </div>
  );
}
