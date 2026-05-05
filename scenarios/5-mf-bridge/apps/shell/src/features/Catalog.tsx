import React from 'react';
import { MFBridgeLazy } from '@mf-toolkit/mf-bridge';
import { useCartStore } from '../store/cartStore';

const loadCatalog = () => import('catalog/entry').then((m) => m.register);

export default function Catalog() {
  const { addItem } = useCartStore();

  return (
    <MFBridgeLazy
      register={loadCatalog}
      // `onAddToCart` is a typed callback prop streamed to the remote.
      // When clicked inside catalog, it mutates shell's cart store.
      props={{ onAddToCart: addItem }}
      fallback={<div>Loading catalog…</div>}
      errorFallback={<div>Catalog unavailable — please try again later.</div>}
      retryCount={2}
      retryDelay={500}
    />
  );
}
