import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Cart from './Cart';

// Standalone dev harness — federated mount is via src/entry.ts.
const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Cart
        items={[{ id: '1', name: 'Demo Item', price: 1999, quantity: 1 }]}
        onRemove={() => {}}
        onClear={() => {}}
      />
    </BrowserRouter>
  </React.StrictMode>
);
