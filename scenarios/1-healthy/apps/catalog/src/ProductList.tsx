import React, { useState } from 'react';
// Imports via barrel — no direct lodash reference in this file
// This is intentional: demonstrates transitive dependency detection
import { paginateProducts, sortProducts, formatPrice } from './utils';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', price: 9999, category: 'Electronics' },
  { id: '2', name: 'Running Shoes', price: 7999, category: 'Sports' },
  { id: '3', name: 'Coffee Maker', price: 4999, category: 'Home' },
  { id: '4', name: 'Yoga Mat', price: 2999, category: 'Sports' },
  { id: '5', name: 'Smart Watch', price: 19999, category: 'Electronics' },
  { id: '6', name: 'Desk Lamp', price: 3499, category: 'Home' },
];

export default function ProductList() {
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const sorted = sortProducts(PRODUCTS, sortField, sortDir);
  const pages = paginateProducts(sorted, 4);
  const currentPage = pages[page] ?? [];

  return (
    <div>
      <h2>Product Catalog</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Sort by:{' '}
          <select value={sortField} onChange={(e) => setSortField(e.target.value as keyof Product)}>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="category">Category</option>
          </select>
        </label>
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          style={{ marginLeft: '0.5rem' }}
        >
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {currentPage.map((p) => (
          <li key={p.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{p.name}</strong> — {formatPrice(p.price)}
            <span style={{ marginLeft: '1rem', color: '#888' }}>{p.category}</span>
          </li>
        ))}
      </ul>
      <div>
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            style={{ marginRight: '0.25rem', fontWeight: i === page ? 'bold' : 'normal' }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
