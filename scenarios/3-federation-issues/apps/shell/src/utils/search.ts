import { debounce } from 'lodash';

export const debouncedSearch = debounce((callback: (query: string) => void, query: string) => {
  callback(query);
}, 300);
