import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

const ProductList = lazy(() => import('catalog/ProductList'));
const Cart = lazy(() => import('checkout/Cart'));

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
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
