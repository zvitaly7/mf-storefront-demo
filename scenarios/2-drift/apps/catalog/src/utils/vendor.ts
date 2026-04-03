// Thin re-export wrapper — intentional barrel pattern.
// --depth direct  : treats this as a re-export, skips it → lodash stays invisible
// --depth local-graph : follows the graph into this file → lodash surfaces
export { chunk, orderBy } from 'lodash';
