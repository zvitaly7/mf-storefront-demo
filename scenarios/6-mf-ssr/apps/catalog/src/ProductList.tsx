import React from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface ProductListProps {
  products: Product[];
  onAddToCart?: (product: { id: string; name: string; price: number }) => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// SSR-friendly component — stateless, accepts all data via props.
// Works under renderToReadableStream without any browser globals.
export function ProductList({ products, onAddToCart }: ProductListProps) {
  return (
    <div data-mf-region="catalog">
      <h2>Product Catalog</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {products.map((p) => (
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

export default ProductList;
