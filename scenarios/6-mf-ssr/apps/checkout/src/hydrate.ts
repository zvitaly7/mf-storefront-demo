import { hydrateWithBridge } from '@mf-toolkit/mf-bridge/hydrate';
import Cart from './Cart';

// Runs in the browser once the SSR HTML is in the DOM.
//
//   1. Finds the <div data-mf-ssr="checkout"> mount point emitted by the fragment
//   2. Reads the serialised props from <script data-mf-props="true">
//   3. Calls ReactDOM.hydrateRoot against the existing markup with those props
//   4. Subscribes to 'propsChanged' CustomEvents so subsequent host re-renders
//      stream new props into this remote without a refetch.
//
// The `namespace` must match the one on <MFBridgeSSR namespace="checkout">
// in the shell — that's the DOMEventBus channel the host uses to push updates.
hydrateWithBridge(Cart, { namespace: 'checkout' });
