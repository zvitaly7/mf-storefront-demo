import { createServer } from 'node:http';
import { handler } from './fragment';

// One of many possible adapters. The mf-ssr handler is runtime-agnostic —
// it accepts a Web Request and returns a Web Response.
//
//   Node 18+                → this file (node:http bridge)
//   Hono                    → app.get('/fragment', (c) => handler(c.req.raw))
//   Next.js Route Handler   → export const GET = handler
//   Cloudflare Worker / Bun → export default { fetch: handler }
const port = Number(process.env.PORT ?? 3102);

createServer(async (req, res) => {
  const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
  const fetchReq = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
  });

  // CORS for dev: lets the host fetch this fragment from a different origin
  // (e.g. browser-side preloadFragment from http://localhost:3000). In
  // production the host fetches server-side, so no CORS is required.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const fetchRes = await handler(fetchReq);

  res.statusCode = fetchRes.status;
  fetchRes.headers.forEach((v, k) => res.setHeader(k, v));
  const body = await fetchRes.text();
  res.end(body);
}).listen(port, () => {
  console.log(`[checkout fragment] listening on http://localhost:${port}/`);
});
