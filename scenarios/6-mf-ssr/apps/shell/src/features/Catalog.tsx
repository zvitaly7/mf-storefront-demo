import React from 'react';
import { MFBridgeSSR } from '@mf-toolkit/mf-ssr';
import { useCartStore } from '../store/cartStore';
import type { Product, ProductListProps } from 'catalog/entry';

// Loader Mode: host imports the remote component directly via Module Federation
// and renders it server-side with renderToReadableStream. No extra HTTP hop.
// Use this when the remote is on the same infra (S3/CDN bundle via MF runtime).
const loadProductList = () =>
  import('catalog/entry').then((m) => m.ProductList);

const PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', price: 9999, category: 'Electronics' },
  { id: '2', name: 'Running Shoes',       price: 7999, category: 'Sports'      },
  { id: '3', name: 'Coffee Maker',        price: 4999, category: 'Home'        },
  { id: '4', name: 'Yoga Mat',            price: 2999, category: 'Sports'      },
];

export default function Catalog() {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <MFBridgeSSR<ProductListProps>
      loader={loadProductList}
      props={{ products: PRODUCTS, onAddToCart: addItem }}
      fallback={<div>Loading catalog…</div>}
      errorFallback={<div>Catalog unavailable.</div>}
      timeout={3000}
      onError={(err) => console.error('catalog SSR failed', err)}
    />
  );
}
