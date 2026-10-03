import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feeToNumber, mercatoWindow, splitTransferType } from './fee';

test('splits API type into fee and category', () => {
  assert.deepEqual(splitTransferType('€ 20M'), { type: 'Transfer', fee: '€ 20M', kind: 'move' });
  assert.equal(splitTransferType('Loan').kind, 'loan');
  assert.equal(splitTransferType('Free').kind, 'free');
  assert.equal(splitTransferType('N/A').type, null);
  assert.equal(splitTransferType('N/A').kind, 'unknown');
  assert.equal(splitTransferType('€0').fee, null);
  assert.equal(splitTransferType('Contract ended').kind, 'ended');
  assert.equal(splitTransferType('Rumour').kind, 'rumour');
});

test('parses fee magnitude', () => {
  assert.equal(feeToNumber('€20M'), 20_000_000);
  assert.equal(feeToNumber('$500k'), 500_000);
});

test('summer and winter windows', () => {
  assert.equal(mercatoWindow(new Date('2026-07-15T00:00:00Z')), 'summer');
  assert.equal(mercatoWindow(new Date('2026-01-10T00:00:00Z')), 'winter');
});
