import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { AuthProvider } from './store/authStore';
import { CartProvider } from './store/cartStore';

// Shell SSR entry. Runs on the edge (CF Worker / Vercel Edge / Bun) or Node 18+.
// `<MFBridgeSSR>` inside App composes remote fragments into the same response
// stream — Suspense boundaries let each fragment flush as soon as its HTML is
// ready, so fast remotes don't wait for slow ones.
export async function handleRequest(req: Request, initialState: {
  user?: { id: string; name: string } | null;
  items?: { id: string; name: string; price: number; quantity: number }[];
}): Promise<Response> {
  const url = new URL(req.url);

  const stream = await renderToReadableStream(
    <StaticRouter location={url.pathname + url.search}>
      <AuthProvider initialUser={initialState.user ?? null}>
        <CartProvider initialItems={initialState.items ?? []}>
          <App />
        </CartProvider>
      </AuthProvider>
    </StaticRouter>,
    {
      // Inline bootstrap: serialises initial state for the client and kicks
      // off hydration once the main bundle downloads.
      bootstrapScriptContent: `window.__SSR_STATE__=${JSON.stringify(initialState)};`,
      bootstrapModules: ['/static/bootstrap.js'],
      onError: (err) => console.error('[shell SSR]', err),
    }
  );

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Shell HTML is per-user; remote fragments manage their own cache-control.
      'cache-control': 'no-store',
    },
  });
}
