// Loader Mode contract: host imports the React component directly via MF.
// Different from mf-bridge's createMFEntry (which returns a register factory
// for client-side DOM mount) — SSR needs the raw component so renderToReadableStream
// can execute it server-side.
export { default as ProductList } from './ProductList';
export type { Product, ProductListProps } from './ProductList';
