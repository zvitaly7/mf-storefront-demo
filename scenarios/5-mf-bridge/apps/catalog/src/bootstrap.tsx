import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ProductList from './ProductList';

// Standalone dev harness — the federated mount point is src/entry.ts.
const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ProductList />
    </BrowserRouter>
  </React.StrictMode>
);
