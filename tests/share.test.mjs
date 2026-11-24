import test from 'node:test'
import assert from 'node:assert/strict'
import { observationDate, observationLabel, shareText, shareUrl } from '../web/share.js'

const event = { kind: 'listing', name: 'Example', modelId: 'lab/example', category: 'huggingface', observedAt: '2026-11-24T07:03:00Z' }

test('share content identifies baseline observations and uses observation time in UTC', () => {
  assert.equal(observationLabel(event), 'BASELINE LISTING')
  assert.match(observationDate(event), /24 Nov 2026.*07:03 UTC/)
  assert.match(shareText(event), /not proof of a launch/)
  assert.match(shareText(event), /@AI_Insta07/)
  assert.equal(observationLabel({ kind: 'new' }), 'NEW IDENTIFIER')
})

test('X draft encodes the source URL without posting automatically', () => {
  const url = new URL(shareUrl(event, 'https://huggingface.co/lab/example'))
  assert.equal(url.hostname, 'twitter.com')
  assert.equal(url.searchParams.get('url'), 'https://huggingface.co/lab/example')
  assert.match(url.searchParams.get('text'), /BASELINE LISTING/)
})

test('long model names leave room for an X source link and retain the evidence caveat', () => {
  const text = shareText({ ...event, name: 'a'.repeat(500), modelId: 'b'.repeat(500) })
  assert.ok(text.length <= 250)
  assert.match(text, /not proof of a launch/)
  assert.match(text, /@AI_Insta07/)
})