import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MFBridgeLazy } from '@mf-toolkit/mf-bridge';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const loadCheckout = () => import('checkout/entry').then((m) => m.register);

type OrderPlacedPayload = { orderId: string };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeItem, clearCart } = useCartStore();
  const cmdRef = useRef<((type: string, payload?: unknown) => void) | null>(null);

  return (
    <div>
      <MFBridgeLazy
        register={loadCheckout}
        // Every change to `items` triggers MFBridgeLazy to dispatch a
        // CustomEvent on the mount element — the remote re-renders with
        // the new props. This is the bridge's prop-streaming path.
        props={{
          userId: user?.id,
          items,
          onRemove: removeItem,
          onClear: clearCart,
        }}
        fallback={<div>Loading cart…</div>}
        errorFallback={<div>Cart unavailable — please try again later.</div>}
        retryCount={2}
        retryDelay={500}
        // remote -> host: checkout emits 'orderPlaced' once the order goes through
        onEvent={(type, payload) => {
          if (type === 'orderPlaced') {
            const { orderId } = payload as OrderPlacedPayload;
            clearCart();
            navigate(`/confirmation?o=${orderId}`);
          }
        }}
        // host -> remote: nudge the checkout widget to reset its internal UI
        commandRef={cmdRef}
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
