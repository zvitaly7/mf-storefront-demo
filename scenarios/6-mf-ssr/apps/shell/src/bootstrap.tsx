import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './store/authStore';
import { CartProvider } from './store/cartStore';

// In production the HTML is rendered on the server by `server.tsx` via
// renderToPipeableStream and `hydrateRoot` attaches to that existing DOM.
// In development (`webpack serve`) we don't run the SSR pipeline — the
// served HTML has an empty <div id="root"> and `hydrateRoot` would log a
// hydration mismatch. Detect that and fall back to `createRoot`.
const container = document.getElementById('root')!;
const ssrState = (window as any).__SSR_STATE__ ?? {};
const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider initialUser={ssrState.user ?? null}>
        <CartProvider initialItems={ssrState.items ?? []}>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
