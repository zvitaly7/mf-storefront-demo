import { createMFEntry } from '@mf-toolkit/mf-bridge/entry';
import Cart, { CartAPI } from './Cart';

// Bridge entry for checkout. Demonstrates:
//   - emit()      remote -> host events    ('orderPlaced')
//   - onCommand() host   -> remote commands ('reset')
// Typed prop contract is inferred by the host from Cart's props.
export const register = createMFEntry(Cart, ({ emit, onCommand }) => {
  CartAPI.onOrderPlaced = (orderId) => emit('orderPlaced', { orderId });

  onCommand((type) => {
    if (type === 'reset') CartAPI.reset?.();
  });
});
