import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import Catalog from './features/Catalog';
import Checkout, { prefetchCheckout } from './features/Checkout';
import Confirmation from './features/Confirmation';

// Compare with scenarios/5-mf-bridge/apps/shell/src/App.tsx:
//   - the features compose <MFBridgeSSR> instead of <MFBridgeLazy>
//   - fragments render server-side → HTML is filled on first paint, no CLS
//   - Loader Mode (catalog) imports the remote component through MF runtime
//   - URL Mode (checkout) fetches a streaming HTML fragment from a worker
//   - hydration is done by the shell's hydrateRoot + per-remote hydrateWithBridge
export default function App() {
  const { user, login, logout } = useAuthStore();
  const { items } = useCartStore();
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Catalog</Link>
        <Link
          to="/cart"
          onMouseEnter={() => prefetchCheckout(user?.id) /* warm the CDN */}
        >
          Cart ({itemCount})
        </Link>
        <span style={{ marginLeft: '2rem' }}>
          {user ? (
            <>
              {user.name} &nbsp;
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button onClick={() => login({ id: 'u_demo', name: 'Demo User' })}>Login</button>
          )}
        </span>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/cart" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
    </div>
  );
}
