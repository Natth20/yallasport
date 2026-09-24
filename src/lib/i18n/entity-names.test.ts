import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayEntityName, officialEntityName } from './entity-names';

test('official and Arabic display stay on one entity', () => {
  const team = { name: 'Real Madrid', officialName: 'Real Madrid CF' };
  assert.equal(officialEntityName(team), 'Real Madrid CF');
  assert.equal(displayEntityName('en', team), 'Real Madrid CF');
  assert.equal(displayEntityName('ar', team), 'ريال مدريد');
});

test('falls back to name when officialName is empty', () => {
  const team = { name: 'Real Madrid', officialName: null };
  assert.equal(officialEntityName(team), 'Real Madrid');
  assert.equal(displayEntityName('ar', team), 'ريال مدريد');
});
