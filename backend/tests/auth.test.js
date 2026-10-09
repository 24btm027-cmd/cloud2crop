const test = require('node:test');
const assert = require('node:assert');
const { signToken, verifyToken } = require('../lib/auth');

test('Auth signs and verifies JWT tokens correctly', () => {
  const payload = { id: 'user_123', role: 'farmer' };
  const token = signToken(payload);
  assert.ok(token && typeof token === 'string');

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, 'user_123');
  assert.strictEqual(decoded.role, 'farmer');
});

test('Auth rejects tampered tokens', () => {
  const token = signToken({ id: 'user_123' });
  assert.throws(() => {
    verifyToken(token + 'tampered');
  });
});
