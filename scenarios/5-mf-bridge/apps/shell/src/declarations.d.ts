// Remotes expose a bridge entry that returns a typed register function.
// `any` is the honest shape here — remote types are resolved through the
// RegisterFn<P> signature produced by createMFEntry, which MFBridgeLazy
// consumes generically. In a real project you'd import the remote's types
// via @module-federation/typescript or a published types package.
declare module 'catalog/entry' {
  export const register: any;
}

declare module 'checkout/entry' {
  export const register: any;
}
