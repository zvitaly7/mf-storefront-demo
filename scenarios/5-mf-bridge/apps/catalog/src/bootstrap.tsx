import React from 'react';
import { createRoot } from 'react-dom/client';
import ProductList from './ProductList';

// Standalone dev harness — the federated entry point is src/entry.ts.
const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ProductList />
  </React.StrictMode>
);
