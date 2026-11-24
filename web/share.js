export function observationLabel(event) {
  return { new: 'NEW IDENTIFIER', updated: 'REGISTRY UPDATE', listing: 'BASELINE LISTING' }[event.kind] || 'OBSERVATION'
}

export function observationDate(event) {
  const date = new Date(event.observedAt)
  if (!event.observedAt || Number.isNaN(date.getTime())) return 'Observation time unavailable'
  return `Observed ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(date)} UTC`
}

export function shareText(event) {
  const source = event.category === 'huggingface' ? 'Hugging Face' : 'models.dev'
  const shorten = value => value.length > 45 ? `${value.slice(0, 44)}…` : value
  const title = shorten(event.name)
  const identifier = shorten(event.modelId)
  return `${observationLabel(event)}\n${title}\n${identifier}\n${source} | ${observationDate(event)}\nCatalog sightings are not proof of a launch.\n\n@AI_Insta07`
}

export function shareUrl(event, sourceUrl) {
  const params = new URLSearchParams({ text: shareText(event), url: sourceUrl })
  return `https://twitter.com/intent/tweet?${params}`
}