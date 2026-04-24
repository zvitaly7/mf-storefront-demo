import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Catalog from './features/Catalog';
import Checkout from './features/Checkout';

// Compare with scenarios/1-healthy/apps/shell/src/App.tsx:
//   - no React.lazy / Suspense here — MFBridgeLazy handles the loading state
//   - no error boundary — MFBridgeLazy has errorFallback + onError + retries
//   - remote props are typed end-to-end via the register export
export default function App() {
  const { user, login, logout } = useAuthStore();

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Catalog</Link>
        <Link to="/cart">Cart</Link>
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
        </Routes>
      </main>
    </div>
  );
}
