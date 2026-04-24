import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ProductList from './ProductList';

// Standalone dev harness. Router context is provided so navigation-aware
// children work under http://localhost:3001 — in production the remote is
// composed inside the shell, which owns the router.
const container = document.getElementById('root')!;
hydrateRoot(
  container,
  <React.StrictMode>
    <BrowserRouter>
      <ProductList
        products={[
          { id: 'demo', name: 'Demo', price: 999, category: 'Demo' },
        ]}
      />
    </BrowserRouter>
  </React.StrictMode>
);
