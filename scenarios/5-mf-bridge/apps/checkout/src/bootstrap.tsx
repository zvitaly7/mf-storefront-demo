import React from 'react';
import { createRoot } from 'react-dom/client';
import Cart from './Cart';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Cart />
  </React.StrictMode>
);
