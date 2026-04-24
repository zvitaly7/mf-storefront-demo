import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Confirmation() {
  const [params] = useSearchParams();
  const orderId = params.get('o');

  return (
    <div>
      <h2>Order confirmed</h2>
      <p>Thanks for your order{orderId ? ` — reference ${orderId}` : ''}.</p>
      <Link to="/">Back to catalog</Link>
    </div>
  );
}
