import crypto from 'node:crypto';

export function createBookingReference() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LS-${stamp}-${rand}`;
}
