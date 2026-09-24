import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessAdminPath, isStaffRole } from './admin-access';

test('anonymous and fans are not staff', () => {
  assert.equal(isStaffRole(null), false);
  assert.equal(isStaffRole('USER'), false);
  assert.equal(isStaffRole('SUPER_ADMIN'), true);
});

test('super admin reaches every admin path', () => {
  assert.equal(canAccessAdminPath('SUPER_ADMIN', '/admin'), true);
  assert.equal(canAccessAdminPath('SUPER_ADMIN', '/admin/users'), true);
  assert.equal(canAccessAdminPath('SUPER_ADMIN', '/admin/streaming'), true);
});

test('editor cannot open users or streaming', () => {
  assert.equal(canAccessAdminPath('EDITOR', '/admin/news'), true);
  assert.equal(canAccessAdminPath('EDITOR', '/admin/users'), false);
  assert.equal(canAccessAdminPath('EDITOR', '/admin/streaming'), false);
});

test('ads manager is limited to ads', () => {
  assert.equal(canAccessAdminPath('ADS_MANAGER', '/admin/ads'), true);
  assert.equal(canAccessAdminPath('ADS_MANAGER', '/admin/news'), false);
});
