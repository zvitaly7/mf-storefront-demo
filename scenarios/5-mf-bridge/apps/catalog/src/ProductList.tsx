import React, { useState } from 'react';

export interface ProductListProps {
  onAddToCart?: (product: { id: string; name: string; price: number }) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', price: 9999, category: 'Electronics' },
  { id: '2', name: 'Running Shoes',       price: 7999, category: 'Sports'      },
  { id: '3', name: 'Coffee Maker',        price: 4999, category: 'Home'        },
  { id: '4', name: 'Yoga Mat',            price: 2999, category: 'Sports'      },
  { id: '5', name: 'Smart Watch',         price: 19999, category: 'Electronics' },
  { id: '6', name: 'Desk Lamp',           price: 3499, category: 'Home'        },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductList({ onAddToCart }: ProductListProps) {
  const [sortField, setSortField] = useState<keyof Product>('name');

  const sorted = [...PRODUCTS].sort((a, b) =>
    String(a[sortField]).localeCompare(String(b[sortField]))
  );

  return (
    <div>
      <h2>Product Catalog</h2>
      <label>
        Sort by:{' '}
        <select value={sortField} onChange={(e) => setSortField(e.target.value as keyof Product)}>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="category">Category</option>
        </select>
      </label>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sorted.map((p) => (
          <li key={p.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{p.name}</strong> — {formatPrice(p.price)}
            <span style={{ marginLeft: '1rem', color: '#888' }}>{p.category}</span>
            {onAddToCart && (
              <button
                style={{ marginLeft: '1rem' }}
                onClick={() => onAddToCart({ id: p.id, name: p.name, price: p.price })}
              >
                Add to cart
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
