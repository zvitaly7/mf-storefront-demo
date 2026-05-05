import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MFBridgeSSR, preloadFragment } from '@mf-toolkit/mf-ssr';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const CHECKOUT_FRAGMENT = process.env.CHECKOUT_FRAGMENT_URL ?? 'http://localhost:3102/';

// URL Mode: remote exposes an HTTP fragment endpoint. Host fetches the pre-rendered
// HTML server-side, inlines it in the response, and after hydration streams prop
// updates via DOMEventBus on a shared `namespace` channel.
type CheckoutEvents = {
  orderPlaced: { orderId: string };
  cancelled: void;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const cmdRef = useRef<((type: string, payload?: unknown) => void) | null>(null);

  // NOTE: was `TypedSSROnEvent<CheckoutEvents>` but the generic signature does
  // not narrow `payload` on `type` checks (the K type parameter stays free in
  // the assignment context). Use a discriminating switch + assertion instead.
  const onEvent = (type: string, payload: unknown) => {
    if (type === 'orderPlaced') {
      const { orderId } = payload as CheckoutEvents['orderPlaced'];
      clearCart();
      navigate(`/confirmation?o=${orderId}`);
    }
  };

  return (
    <div>
      <MFBridgeSSR
        url={CHECKOUT_FRAGMENT}
        namespace="checkout"
        props={{ userId: user?.id, items }}
        fallback={<div>Loading cart…</div>}
        errorFallback={<div>Cart unavailable — please try again later.</div>}
        timeout={2000}
        retryCount={2}
        retryDelay={500}
        onEvent={onEvent}
        commandRef={cmdRef}
        cacheKey={user?.id /* per-user fragment cache slot */}
        fetchOptions={{
          headers: user
            ? { 'x-user-id': user.id /* auth / trace headers here */ }
            : {},
        }}
      />
      <button
        style={{ marginTop: '1rem' }}
        onClick={() => cmdRef.current?.('reset')}
      >
        Reset checkout widget (host command)
      </button>
    </div>
  );
}

// Start fetching the fragment on hover — first paint is already warm by the time
// the user clicks. Safe to call many times; the request is memoised per key.
export function prefetchCheckout(userId?: string) {
  preloadFragment(CHECKOUT_FRAGMENT, { userId, items: [] });
}
