import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import Catalog from './features/Catalog';
import Checkout from './features/Checkout';
import Confirmation from './features/Confirmation';

// Compare with scenarios/1-healthy/apps/shell/src/App.tsx:
//   - no React.lazy / Suspense here — MFBridgeLazy owns the loading state
//   - no error boundary — MFBridgeLazy has errorFallback + onError + retries
//   - remote props are typed end-to-end via the register export
//   - cart state is owned by the shell and streamed to checkout via props
export default function App() {
  const { user, login, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Catalog</Link>
        <Link to="/cart">Cart ({itemCount})</Link>
        <span style={{ marginLeft: '2rem' }}>
          {user ? (
            <>
              {user.name} &nbsp;
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button onClick={() => login({ id: '1', name: 'Demo User' })}>Login</button>
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
