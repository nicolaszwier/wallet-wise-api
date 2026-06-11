import { createHash, randomBytes } from 'crypto';

export function generatePasswordResetToken() {
  return randomBytes(32).toString('hex');
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
