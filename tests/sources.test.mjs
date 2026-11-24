import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogRecords, huggingFaceRecords } from '../tracker/sources.mjs'

test('normalizes catalog identifiers without treating a listing as a release', () => {
  const records = catalogRecords({ lab: { name: 'Lab', models: { 'model-a': { name: 'Model A', release_date: '2025-01-01', open_weights: true } } } })
  assert.equal(records[0].id, 'lab/model-a')
  assert.equal(records[0].openWeights, true)
  assert.equal(records[0].category, 'catalog')
})

test('normalizes only records belonging to the requested organization', () => {
  const records = huggingFaceRecords([{ id: 'Qwen/Qwen-Model', createdAt: '2025-01-01' }], 'Qwen')
  assert.equal(records[0].url, 'https://huggingface.co/Qwen/Qwen-Model')
  assert.equal(records[0].openWeights, false)
  assert.throws(() => huggingFaceRecords([{ id: 'other/model' }], 'Qwen'))
  assert.throws(() => huggingFaceRecords({}, 'Qwen'))
})