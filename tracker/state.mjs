import { createHash } from 'node:crypto'

export const initialState = () => ({ version: 1, sources: {}, events: [] })

function fingerprint(record) {
  return createHash('sha256').update(JSON.stringify(record)).digest('hex')
}

export function updateSource(state, source, records, observedAt) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Source returned no records')
  const previous = state.sources[source]
  const baseline = { ...(previous?.baseline || {}) }
  const firstScan = !previous?.lastSuccess
  const additions = []
  for (const record of records) {
    if (!record.id || !record.name || !record.url) throw new Error('Invalid source record')
    const hash = fingerprint(record)
    const old = baseline[record.id]
    if (!old || old !== hash) {
      additions.push({
        ...record,
        source,
        observedAt,
        kind: firstScan ? 'listing' : old ? 'updated' : 'new',
        eventId: `${source}:${record.id}:${hash}`
      })
    }
    baseline[record.id] = hash
  }
  const visible = firstScan
    ? additions.sort((left, right) => (right.publishedAt || '').localeCompare(left.publishedAt || '')).slice(0, 60)
    : additions
  const existing = new Set(state.events.map(event => event.eventId))
  state.events = [...visible.filter(event => !existing.has(event.eventId)), ...state.events].slice(0, 1000)
  state.sources[source] = { baseline, lastAttempt: observedAt, lastSuccess: observedAt, error: null }
  return state
}

export function failSource(state, source, observedAt, error) {
  state.sources[source] = {
    ...(state.sources[source] || { baseline: {}, lastSuccess: null }),
    lastAttempt: observedAt,
    error: String(error).slice(0, 200)
  }
  return state
}