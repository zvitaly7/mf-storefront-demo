import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MFBridgeLazy } from '@mf-toolkit/mf-bridge';
import { useAuthStore } from '../store/authStore';

const loadCheckout = () => import('checkout/entry').then((m) => m.register);

type OrderPlacedPayload = { orderId: string };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cmdRef = useRef<((type: string, payload?: unknown) => void) | null>(null);

  return (
    <div>
      <MFBridgeLazy
        register={loadCheckout}
        // Typed, streamed to the remote via a CustomEvent on prop change.
        props={{ userId: user?.id }}
        fallback={<div>Loading cart…</div>}
        errorFallback={<div>Cart unavailable — please try again later.</div>}
        retryCount={2}
        retryDelay={500}
        // remote -> host: the cart emits 'orderPlaced' when the order is placed
        onEvent={(type, payload) => {
          if (type === 'orderPlaced') {
            const { orderId } = payload as OrderPlacedPayload;
            navigate(`/confirmation?o=${orderId}`);
          }
        }}
        // host -> remote: send a 'reset' command (e.g. on logout)
        commandRef={cmdRef}
      />
      <button
        style={{ marginTop: '1rem' }}
        onClick={() => cmdRef.current?.('reset')}
      >
        Reset cart (host command)
      </button>
    </div>
  );
}
