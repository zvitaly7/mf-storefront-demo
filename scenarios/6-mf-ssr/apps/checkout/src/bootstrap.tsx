import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Cart from './Cart';

// Standalone dev harness. Router context is provided for parity with the
// host — in production this remote is rendered server-side by
// server/fragment.ts and hydrated by src/hydrate.ts.
const container = document.getElementById('root')!;
hydrateRoot(
  container,
  <React.StrictMode>
    <BrowserRouter>
      <Cart items={[{ id: '1', name: 'Demo Item', price: 1999, quantity: 1 }]} />
    </BrowserRouter>
  </React.StrictMode>
);
