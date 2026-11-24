import test from 'node:test'
import assert from 'node:assert/strict'
import { failSource, initialState, updateSource } from '../tracker/state.mjs'

const first = { id: 'one', name: 'One', url: 'https://example.com/one', publishedAt: '2025-01-01' }
const second = { id: 'two', name: 'Two', url: 'https://example.com/two', publishedAt: '2025-02-01' }

test('first scan seeds listings and subsequent scans detect changes without duplicates', () => {
  const state = initialState()
  updateSource(state, 'catalog', [first], '2026-01-01T00:00:00Z')
  assert.equal(state.events[0].kind, 'listing')
  updateSource(state, 'catalog', [first, second], '2026-01-02T00:00:00Z')
  assert.equal(state.events[0].kind, 'new')
  assert.equal(state.events.length, 2)
  updateSource(state, 'catalog', [{ ...first, name: 'One revised' }, second], '2026-01-03T00:00:00Z')
  assert.equal(state.events[0].kind, 'updated')
  updateSource(state, 'catalog', [{ ...first, name: 'One revised' }, second], '2026-01-04T00:00:00Z')
  assert.equal(state.events.length, 3)
})

test('failed and empty scans keep the previous baseline and observations', () => {
  const state = initialState()
  updateSource(state, 'catalog', [first], '2026-01-01T00:00:00Z')
  const before = JSON.stringify(state.sources.catalog.baseline)
  assert.throws(() => updateSource(state, 'catalog', [], '2026-01-02T00:00:00Z'))
  failSource(state, 'catalog', '2026-01-02T00:00:00Z', 'Unavailable')
  assert.equal(JSON.stringify(state.sources.catalog.baseline), before)
  assert.equal(state.sources.catalog.lastSuccess, '2026-01-01T00:00:00Z')
  assert.equal(state.events.length, 1)
})