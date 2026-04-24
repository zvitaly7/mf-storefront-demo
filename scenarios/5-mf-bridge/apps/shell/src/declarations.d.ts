// Remotes expose a bridge entry that returns a typed register function.
// MFBridgeLazy infers prop types from the remote's register export.
declare module 'catalog/entry' {
  export const register: unknown;
}

declare module 'checkout/entry' {
  export const register: unknown;
}
