import { renderShareCard } from './card.js'
import { shareUrl } from './share.js'

const byId = id => document.getElementById(id)
const feedElement = byId('feed')
const storageKey = 'model-signal-read-v1'
let events = []
let activeFilter = 'all'
let query = ''
let limit = 30
let readIds = new Set()
let shareEvent = null

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
  if (Array.isArray(saved)) readIds = new Set(saved)
} catch {}

function saveRead() {
  try { localStorage.setItem(storageKey, JSON.stringify([...readIds].slice(-2000))) } catch {}
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function dateLabel(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return 'Date unavailable'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function displayTime(event) {
  return event.kind === 'listing' && event.publishedAt ? event.publishedAt : event.observedAt
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['models.dev', 'huggingface.co'].includes(url.hostname) ? url.href : null
  } catch { return null }
}

async function openShare(event, url) {
  shareEvent = event
  byId('share-status').textContent = 'Preparing image...'
  byId('download-card').disabled = true
  byId('open-x').href = shareUrl(event, url)
  byId('share-dialog').showModal()
  try {
    await renderShareCard(byId('share-canvas'), event)
    byId('download-card').disabled = false
    byId('share-status').textContent = ''
  } catch (error) {
    byId('share-status').textContent = `Unable to prepare image: ${error.message}`
  }
}

byId('share-close').addEventListener('click', () => byId('share-dialog').close())
byId('download-card').addEventListener('click', () => {
  byId('share-canvas').toBlob(blob => {
    if (!blob) {
      byId('share-status').textContent = 'Unable to generate image.'
      return
    }
    const url = URL.createObjectURL(blob)
    const download = document.createElement('a')
    download.href = url
    const name = shareEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'observation'
    download.download = `ai-insta-${name}.png`
    document.body.append(download)
    download.click()
    download.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
    byId('share-status').textContent = 'Image downloaded. Attach it to your X draft.'
  }, 'image/png')
})

function makeEvent(event) {
  const card = element('article', 'event')
  const avatar = element('div', 'provider-icon', event.provider.slice(0, 2).toUpperCase())
  avatar.setAttribute('aria-hidden', 'true')
  const content = element('div', 'event-content')
  const top = element('div', 'event-top')
  const source = element('div', 'event-source', `${event.provider} / ${event.category === 'huggingface' ? 'Hugging Face' : 'models.dev'}`)
  if (!readIds.has(event.eventId)) {
    const dot = element('span', 'unread-dot')
    dot.setAttribute('aria-label', 'Unread')
    source.append(dot)
  }
  const time = element('time', 'event-time', `${event.kind === 'listing' && event.publishedAt ? 'SOURCE DATE' : 'OBSERVED'} ${dateLabel(displayTime(event))}`)
  top.append(source, time)
  const title = element('h3')
  const url = safeUrl(event.url)
  const link = element(url ? 'a' : 'span', '', event.name)
  if (url) {
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.addEventListener('click', () => { readIds.add(event.eventId); saveRead(); render() })
  }
  title.append(link)
  const id = element('div', 'event-id', event.modelId)
  const bottom = element('div', 'event-bottom')
  const label = { new: 'NEW IDENTIFIER', updated: 'REGISTRY UPDATE', listing: 'BASELINE LISTING' }[event.kind] || 'OBSERVATION'
  bottom.append(element('span', `badge ${event.kind}`, label))
  if (event.openWeights) bottom.append(element('span', 'badge open', 'OPEN WEIGHTS'))
  if (url) {
    const share = element('button', 'create-post', 'Create post')
    share.type = 'button'
    share.addEventListener('click', () => openShare(event, url))
    const copy = element('button', 'copy-link', 'Copy link')
    copy.type = 'button'
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url)
        copy.textContent = 'Copied'
      } catch {
        copy.textContent = 'Copy unavailable'
      }
    })
    const sourceLink = element('a', 'event-link', 'View source ↗')
    sourceLink.href = url
    sourceLink.target = '_blank'
    sourceLink.rel = 'noopener noreferrer'
    sourceLink.addEventListener('click', () => { readIds.add(event.eventId); saveRead(); render() })
    bottom.append(share, copy, sourceLink)
  }
  content.append(top, title, id, bottom)
  card.append(avatar, content)
  return card
}

function render() {
  const filtered = events.filter(event => {
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' ? !readIds.has(event.eventId) : activeFilter === 'open' ? event.openWeights : event.kind === activeFilter)
    return matchesFilter && `${event.name} ${event.modelId} ${event.provider} ${event.source}`.toLowerCase().includes(query)
  })
  byId('result-count').textContent = `${filtered.length.toLocaleString()} OBSERVATIONS`
  byId('side-count').textContent = events.filter(event => !readIds.has(event.eventId)).length.toLocaleString()
  feedElement.replaceChildren(...filtered.slice(0, limit).map(makeEvent))
  if (!filtered.length) feedElement.append(element('div', 'empty', 'No observations match your filters.'))
  byId('load-more').hidden = filtered.length <= limit
}

for (const button of document.querySelectorAll('.filter')) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter
    limit = 30
    for (const item of document.querySelectorAll('.filter')) {
      const selected = item === button
      item.classList.toggle('active', selected)
      item.setAttribute('aria-pressed', String(selected))
    }
    render()
  })
}
byId('search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); limit = 30; render() })
byId('load-more').addEventListener('click', () => { limit += 30; render() })
byId('mark-read').addEventListener('click', () => { for (const event of events) readIds.add(event.eventId); saveRead(); render() })

async function loadFeed() {
  try {
    const response = await fetch('./data/feed.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`Feed unavailable (HTTP ${response.status})`)
    const data = await response.json()
    if (!Array.isArray(data.events) || !data.sources) throw new Error('Invalid feed')
    events = data.events.filter(event => event.eventId && event.name && event.provider && event.modelId).sort((left, right) => (displayTime(right) || '').localeCompare(displayTime(left) || ''))
    const sourceEntries = Object.entries(data.sources)
    const healthy = sourceEntries.filter(([, source]) => !source.error && source.lastSuccess && Date.now() - Date.parse(source.lastSuccess) < 6 * 60 * 60 * 1000).length
    byId('total-count').textContent = events.length.toLocaleString()
    byId('new-count').textContent = events.filter(event => event.kind === 'new').length.toLocaleString()
    byId('updated-count').textContent = events.filter(event => event.kind === 'updated').length.toLocaleString()
    byId('healthy-count').textContent = `${healthy}/${sourceEntries.length}`
    byId('last-scan').textContent = dateLabel(data.generatedAt)
    byId('header-status').textContent = healthy === sourceEntries.length ? 'ALL SOURCES OPERATIONAL' : 'SOURCES NEED ATTENTION'
    byId('side-health').textContent = `${healthy} of ${sourceEntries.length} sources healthy`
    const health = byId('source-health')
    for (const [name, source] of sourceEntries) {
      const stale = !source.lastSuccess || Date.now() - Date.parse(source.lastSuccess) >= 6 * 60 * 60 * 1000
      const status = source.error ? 'ERROR' : stale ? 'STALE' : 'OK'
      const row = element('div', 'health-row')
      const dot = element('span', `side-dot${status !== 'OK' ? ' error' : ''}`)
      dot.setAttribute('aria-hidden', 'true')
      const sourceName = element('span', 'health-name', name.replace('huggingface:', 'HF / '))
      const label = element('span', `health-status${status !== 'OK' ? ' error' : ''}`, status)
      row.title = `Last success: ${dateLabel(source.lastSuccess)}${source.error ? ` | ${source.error}` : ''}`
      row.append(dot, sourceName, label)
      health.append(row)
    }
    render()
  } catch (error) {
    byId('header-status').textContent = 'FEED UNAVAILABLE'
    byId('result-count').textContent = 'FEED UNAVAILABLE'
    feedElement.replaceChildren(element('div', 'empty', `Unable to load the feed. ${error.message}`))
  }
}

loadFeed()