import React from 'react';
import { MFBridgeLazy } from '@mf-toolkit/mf-bridge';

const loadCatalog = () => import('catalog/entry').then((m) => m.register);

export default function Catalog() {
  return (
    <MFBridgeLazy
      register={loadCatalog}
      props={{}}
      fallback={<div>Loading catalog…</div>}
      errorFallback={<div>Catalog unavailable — please try again later.</div>}
      retryCount={2}
      retryDelay={500}
    />
  );
}
