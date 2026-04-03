import { chunk, orderBy } from 'lodash';

export function paginateProducts<T>(items: T[], pageSize: number): T[][] {
  return chunk(items, pageSize);
}

export function sortProducts<T extends object>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return orderBy(items, [field as string], [direction]) as T[];
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
