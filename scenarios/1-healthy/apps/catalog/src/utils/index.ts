// Barrel re-export — lodash is accessed transitively via format.ts
// This is the key pattern for demonstrating --depth local-graph analysis:
// --depth direct  → misses lodash, scores 100
// --depth local-graph → surfaces lodash as share candidate, scores 92
export { paginateProducts, sortProducts, formatPrice } from './format';
