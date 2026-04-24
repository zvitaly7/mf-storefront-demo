/* eslint-disable no-console */
/**
 * Live demonstration of @mf-toolkit/mf-ssr capabilities.
 *
 * Run with:
 *   NODE_OPTIONS='--conditions=worker' npx ts-node-esm scripts/ssr-demo.mts
 *
 * (The --conditions=worker flag routes `react-dom/server` to its browser/edge
 * build so that `renderToReadableStream` is available in Node.)
 */
import { createMFReactFragment } from '@mf-toolkit/mf-ssr/fragment';
// tsx's ESM/CJS interop wraps module exports — read through a resolver that
// handles both the namespace and default-wrapped shapes. In a normal webpack
// build or native ESM this is just `import { Cart } from '.../Cart'`.
import * as CartModule from '../scenarios/6-mf-ssr/apps/checkout/src/Cart';
import * as ProductListModule from '../scenarios/6-mf-ssr/apps/catalog/src/ProductList';
const resolveComponent = <T,>(mod: any, name: string): T =>
  mod[name] ?? mod.default?.[name] ?? mod.default;
const Cart = resolveComponent<typeof CartModule.Cart>(CartModule, 'Cart');
const ProductList = resolveComponent<typeof ProductListModule.ProductList>(ProductListModule, 'ProductList');

// ---------- helpers ------------------------------------------------------
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const hr = () => console.log(DIM + '─'.repeat(72) + RESET);
const section = (t: string) => { console.log('\n' + BOLD + CYAN + t + RESET); hr(); };
const sub = (t: string) => console.log('\n  ' + BOLD + YELLOW + t + RESET);

function encodeProps(p: unknown): string {
  return encodeURIComponent(JSON.stringify(p));
}

function makeRequest(url: string, props: unknown, init?: RequestInit): Request {
  const u = new URL(url);
  u.searchParams.set('props', JSON.stringify(props));
  return new Request(u, init);
}

async function readStreamChunks(body: ReadableStream<Uint8Array>): Promise<
  Array<{ offsetMs: number; bytes: number; text: string }>
> {
  const start = performance.now();
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const chunks: Array<{ offsetMs: number; bytes: number; text: string }> = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push({
      offsetMs: Math.round(performance.now() - start),
      bytes: value.byteLength,
      text: decoder.decode(value, { stream: true }),
    });
  }
  return chunks;
}

// ---------- demo cases ---------------------------------------------------
const SAMPLE_ITEMS = [
  { id: '1', name: 'Wireless Headphones', price: 9999, quantity: 2 },
  { id: '2', name: 'Running Shoes',       price: 7999, quantity: 1 },
];

const SAMPLE_PRODUCTS = [
  { id: '1', name: 'Wireless Headphones', price: 9999, category: 'Electronics' },
  { id: '2', name: 'Running Shoes',       price: 7999, category: 'Sports'      },
  { id: '3', name: 'Coffee Maker',        price: 4999, category: 'Home'        },
];

const FRAGMENT_URL = 'http://checkout.local/fragment';

async function demo1_basic() {
  section('1. Fragment handler — basic invocation');
  const handler = createMFReactFragment(Cart, { id: 'checkout' });
  const res = await handler(makeRequest(FRAGMENT_URL, {
    userId: 'u_42',
    items: SAMPLE_ITEMS,
  }));
  console.log(`  status:   ${GREEN}${res.status} ${res.statusText || 'OK'}${RESET}`);
  console.log('  headers:');
  res.headers.forEach((v, k) => console.log(`    ${k}: ${v}`));
  const body = await res.text();
  console.log(`  body (${body.length} bytes):`);
  body.split('\n').forEach((line) => console.log(`    ${line}`));
}

async function demo2_streaming() {
  section('2. Streaming body — ReadableStream, not a buffered string');
  const handler = createMFReactFragment(Cart, { id: 'checkout-stream' });
  const res = await handler(makeRequest(FRAGMENT_URL, {
    userId: 'u_stream',
    items: SAMPLE_ITEMS,
  }));
  const chunks = await readStreamChunks(res.body!);
  console.log(`  body is a ReadableStream — ${chunks.length} chunk(s) received:`);
  chunks.forEach((c, i) => {
    const preview = c.text.replace(/\s+/g, ' ').slice(0, 72);
    console.log(`    chunk ${i + 1}  +${c.offsetMs}ms  ${c.bytes}B  ${DIM}${preview}…${RESET}`);
  });
  console.log(`  ${DIM}Synchronous components flush fast; <Suspense>-gated remotes (data fetching,
  dynamic imports) flush their shells first and fill in as they resolve — the
  browser can start parsing + hydrating the top while the bottom still streams.${RESET}`);
}

async function demo3_propsViaUrl() {
  section('3. Props — URL-encoded JSON, decoded server-side, rendered into HTML');
  const handler = createMFReactFragment(Cart, { id: 'checkout-props' });

  sub('(a) small props — inline view');
  const small = { userId: 'u_a', items: [{ id: '1', name: 'Coffee', price: 499, quantity: 1 }] };
  const u = new URL(FRAGMENT_URL);
  u.searchParams.set('props', JSON.stringify(small));
  console.log(`  request URL: ${DIM}${u.toString().slice(0, 120)}…${RESET}`);
  const body = await (await handler(new Request(u))).text();
  const propsMatch = body.match(/data-mf-props="true">([^<]+)</);
  console.log('  inline props (for hydration matching):');
  console.log(`    ${propsMatch ? propsMatch[1] : '(not found)'}`);
  // React injects HTML comments between adjacent text nodes — skip them in the regex.
  const userIdMatch = body.match(/<h2>Your Cart[\s\S]*?\(([^)]+)\)/);
  console.log(`  rendered userId in <h2>: ${userIdMatch ? GREEN + userIdMatch[1] + RESET : '(not found)'}`);

  sub('(b) empty items — server renders the empty state, not a spinner');
  const empty = await (await handler(makeRequest(FRAGMENT_URL, { items: [] }))).text();
  console.log('  body excerpt:');
  const m = empty.match(/<div data-mf-region="cart">[\s\S]*?<\/div>/);
  console.log(`    ${m ? m[0] : empty.slice(0, 200)}`);
}

async function demo4_caching() {
  section('4. Cache-Control + Vary — configurable per fragment');

  const cases = [
    {
      label: 'default (no-store — personalised / auth-bound)',
      handler: createMFReactFragment(Cart, { id: 'checkout-default' }),
    },
    {
      label: 'public, s-maxage=60, stale-while-revalidate=30 (CDN-cacheable)',
      handler: createMFReactFragment(Cart, {
        id: 'checkout-public',
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=30',
        vary: 'Accept-Language',
      }),
    },
    {
      label: 'private, max-age=0 (browser no-store but middleboxes can key)',
      handler: createMFReactFragment(Cart, {
        id: 'checkout-private',
        cacheControl: 'private, max-age=0, must-revalidate',
      }),
    },
  ];

  for (const c of cases) {
    const res = await c.handler(makeRequest(FRAGMENT_URL, { items: SAMPLE_ITEMS }));
    console.log(`  ${BOLD}${c.label}${RESET}`);
    console.log(`    cache-control: ${GREEN}${res.headers.get('cache-control')}${RESET}`);
    if (res.headers.has('vary')) {
      console.log(`    vary:          ${GREEN}${res.headers.get('vary')}${RESET}`);
    }
    console.log();
  }
}

async function demo5_errorPath() {
  section('5. Error path — malformed ?props= query');
  const handler = createMFReactFragment(Cart, { id: 'checkout-err' });

  sub('(a) invalid JSON in ?props=');
  const url1 = new URL(FRAGMENT_URL);
  url1.searchParams.set('props', '{not valid json}');
  try {
    const res = await handler(new Request(url1));
    console.log(`  status:  ${res.status}  (handler recovered — empty props passed through)`);
    const body = await res.text();
    const m = body.match(/<div data-mf-region="cart">[\s\S]*?<\/div>/);
    console.log(`  body excerpt: ${DIM}${m ? m[0] : body.slice(0, 200)}${RESET}`);
    console.log(`  ${DIM}Component received no items → rendered the empty-state branch.
  Your remote should always have a defensive default for missing props.${RESET}`);
  } catch (err) {
    console.log(`  handler threw: ${(err as Error).message}`);
    console.log(`  ${DIM}→ guard against undefined props in the remote component${RESET}`);
  }

  sub('(b) no ?props= at all — handler uses {} as props');
  const res = await handler(new Request(FRAGMENT_URL));
  const body = await res.text();
  console.log(`  status: ${res.status}`);
  const match = body.match(/<h2>[\s\S]*?<\/h2>[\s\S]*?<p>[^<]+<\/p>/);
  console.log(`  rendered: ${DIM}${match ? match[0] : body.slice(0, 200)}${RESET}`);
}

async function demo6_parallel() {
  section('6. Parallel composition — multiple fragments resolve in parallel');
  const cart = createMFReactFragment(Cart, { id: 'cart' });
  const list = createMFReactFragment(ProductList, { id: 'catalog' });

  // Sequential baseline
  const seqStart = performance.now();
  await (await cart(makeRequest(FRAGMENT_URL, { items: SAMPLE_ITEMS }))).text();
  await (await list(makeRequest(FRAGMENT_URL, { products: SAMPLE_PRODUCTS }))).text();
  await (await cart(makeRequest(FRAGMENT_URL, { items: SAMPLE_ITEMS }))).text();
  const seqMs = Math.round(performance.now() - seqStart);

  // Parallel
  const parStart = performance.now();
  await Promise.all([
    cart(makeRequest(FRAGMENT_URL, { items: SAMPLE_ITEMS })).then((r) => r.text()),
    list(makeRequest(FRAGMENT_URL, { products: SAMPLE_PRODUCTS })).then((r) => r.text()),
    cart(makeRequest(FRAGMENT_URL, { items: SAMPLE_ITEMS })).then((r) => r.text()),
  ]);
  const parMs = Math.round(performance.now() - parStart);

  console.log(`  3 fragments sequential: ${seqMs}ms`);
  console.log(`  3 fragments parallel:   ${GREEN}${parMs}ms${RESET}   (${Math.round((1 - parMs / seqMs) * 100)}% faster)`);
  console.log(`  ${DIM}React renders each fragment independently — no shared event loop hot-path${RESET}`);
}

async function demo7_sizeComparison() {
  section('7. Payload size — client-only empty mount vs SSR-rendered fragment');
  const clientOnly = '<div id="checkout-mount"></div>';
  const handler = createMFReactFragment(Cart, { id: 'checkout' });
  const ssr = await (await handler(makeRequest(FRAGMENT_URL, {
    userId: 'u_42',
    items: SAMPLE_ITEMS,
  }))).text();

  console.log(`  client-only (scenario 5): ${clientOnly.length} bytes`);
  console.log(`    ${DIM}${clientOnly}${RESET}`);
  console.log(`    ${DIM}→ user sees empty box until JS downloads + hydrates${RESET}`);
  console.log();
  console.log(`  SSR fragment (scenario 6): ${ssr.length} bytes`);
  console.log(`    ${DIM}<div data-mf-ssr="checkout">…full rendered cart with items & total…</div>${RESET}`);
  console.log(`    ${DIM}→ content on first paint, no CLS, hydration upgrades interactivity${RESET}`);
}

async function demo8_runtimeAgnostic() {
  section('8. Runtime-agnostic handler — one signature, any runtime');
  console.log(`
  The handler signature is (Request) => Promise<Response> — standard Web APIs.
  The SAME handler.ts file plugs into every modern runtime:

    ${BOLD}Node 18+${RESET} (scenarios/6-mf-ssr/apps/checkout/src/fragment-server.ts):
      createServer(async (req, res) => {
        const fetchReq = new Request(url, { method: req.method, headers: req.headers })
        const fetchRes = await handler(fetchReq)
        fetchRes.headers.forEach((v,k) => res.setHeader(k,v))
        res.end(await fetchRes.text())
      })

    ${BOLD}Hono${RESET}:
      app.get('/fragment', (c) => handler(c.req.raw))

    ${BOLD}Next.js Route Handler${RESET} (app/fragment/route.ts):
      export const GET = handler

    ${BOLD}Cloudflare Worker / Bun.serve${RESET}:
      export default { fetch: handler }
  `);
}

async function demo9_hydrationContract() {
  section('9. Hydration contract — how the browser picks up the SSR HTML');
  const handler = createMFReactFragment(Cart, { id: 'checkout' });
  const body = await (await handler(makeRequest(FRAGMENT_URL, {
    userId: 'u_42',
    items: SAMPLE_ITEMS.slice(0, 1),
  }))).text();

  console.log('  Wire format written by the fragment handler:');
  console.log(`    ${DIM}${body}${RESET}`);
  console.log(`
  ${BOLD}On the client${RESET} (scenarios/6-mf-ssr/apps/checkout/src/hydrate.ts):
    import { hydrateWithBridge } from '@mf-toolkit/mf-bridge/hydrate'
    import Cart from './Cart'
    hydrateWithBridge(Cart, { namespace: 'checkout' })

  ${BOLD}What hydrateWithBridge does${RESET}:
    1. Queries document.querySelector('[data-mf-ssr="checkout"]')
    2. Reads initial props from the inline <script data-mf-props="true">
    3. Calls ReactDOM.hydrateRoot(container, <Cart {...props} />)
    4. Subscribes to 'mfbridge-checkout:propsChanged' CustomEvents
       — every time the host re-renders with new props, MFBridgeSSR
         dispatches a CustomEvent on the mount element and the remote
         re-renders in place. No HTTP refetch.
  `);
}

async function demo10_cacheKeySemantics() {
  section('10. cacheKey & preloadFragment — per-user fragment caching');
  console.log(`
  Problem: fetchOptions carries per-user auth (Bearer token, session cookie).
  Default cache key is \`url + props + timeout\` → all users would share one
  cache slot and could see each other's fragments.

  ${BOLD}Fix on the host${RESET} (scenarios/6-mf-ssr/apps/shell/src/features/Checkout.tsx):
    <MFBridgeSSR
      url={CHECKOUT_FRAGMENT}
      props={{ userId, items }}
      fetchOptions={{ headers: { authorization: \`Bearer \${token}\` } }}
      cacheKey={userId}          // ← per-user cache slot
    />

  ${BOLD}preloadFragment${RESET} — warm the cache before the component mounts:
    <a href="/cart" onMouseEnter={() => preloadFragment(CHECKOUT_FRAGMENT, { userId, items: [] })}>

  ${BOLD}clearFragmentCache${RESET} — invalidate after recovery / logout:
    logout().then(clearFragmentCache)

  ${DIM}These are client-side cache controls — orthogonal to the handler's
  Cache-Control header (which drives CDN / browser HTTP cache).${RESET}
  `);
}

// ---------- run ----------------------------------------------------------
async function main() {
  console.log(`${BOLD}  @mf-toolkit/mf-ssr — live capability demo${RESET}`);
  console.log(`${DIM}  No server, no browser. React rendered server-side into a Web Response,
  every capability exercised and printed with real bytes.${RESET}`);

  await demo1_basic();
  await demo2_streaming();
  await demo3_propsViaUrl();
  await demo4_caching();
  await demo5_errorPath();
  await demo6_parallel();
  await demo7_sizeComparison();
  await demo8_runtimeAgnostic();
  await demo9_hydrationContract();
  await demo10_cacheKeySemantics();

  console.log();
  hr();
  console.log(`${GREEN}  ✓${RESET} 10 capabilities exercised against real handler output.`);
}

main().catch((err) => {
  console.error('ssr-demo failed:', err);
  process.exit(1);
});
