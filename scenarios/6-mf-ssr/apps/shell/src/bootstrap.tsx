import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './store/authStore';
import { CartProvider } from './store/cartStore';

// Client-side hydration. The HTML was rendered on the server by `server.tsx`
// via renderToPipeableStream — hydrateRoot attaches to that existing DOM.
const container = document.getElementById('root')!;
const ssrState = (window as any).__SSR_STATE__ ?? {};

hydrateRoot(
  container,
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
