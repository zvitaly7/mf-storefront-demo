import { createMFReactFragment } from '@mf-toolkit/mf-ssr/fragment';
import Cart from '../src/Cart';

// Server-side fragment handler. Web-standard shape: (Request) => Promise<Response>.
// Runs on Node 18+, Cloudflare Workers, Vercel Edge, Bun — same code, no adapter layer.
// Reads props from `?props=<url-encoded-json>`.
export const handler = createMFReactFragment(Cart, {
  id: 'checkout',

  // CDN-cacheable for the anonymous case. Personalised fragments should
  // either override this at the CDN layer (Cache-Control headers from the
  // gateway) or call the handler with `cacheControl: 'no-store'`.
  cacheControl: 'public, s-maxage=60, stale-while-revalidate=30',

  // Tell the CDN to vary by language if the remote localises. If auth-bound,
  // switch to private cacheControl and set 'Authorization'.
  vary: 'Accept-Language',
});

export default handler;
