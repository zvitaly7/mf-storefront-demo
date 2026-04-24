import { createMFEntry } from '@mf-toolkit/mf-bridge/entry';
import ProductList from './ProductList';

// Typed contract — host infers ProductList's prop types from this export.
export const register = createMFEntry(ProductList);
