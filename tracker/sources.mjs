const organizations = ['deepseek-ai', 'Qwen', 'meta-llama', 'mistralai', 'google', 'microsoft', 'nvidia', 'openai', 'allenai', 'MiniMaxAI', 'moonshotai', 'zai-org', 'tencent']

export const sourceNames = ['models.dev', ...organizations.map(name => `huggingface:${name}`)]

export function catalogRecords(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid catalog response')
  return Object.entries(data).flatMap(([providerId, provider]) => {
    if (!provider?.models || typeof provider.models !== 'object') return []
    return Object.entries(provider.models).map(([modelId, model]) => ({
      id: `${providerId}/${modelId}`,
      name: model.name || modelId,
      modelId,
      provider: provider.name || providerId,
      url: `https://models.dev/?search=${encodeURIComponent(modelId)}`,
      publishedAt: model.release_date || null,
      category: 'catalog',
      openWeights: model.open_weights === true
    }))
  })
}

export function huggingFaceRecords(data, organization) {
  if (!Array.isArray(data)) throw new Error('Invalid Hugging Face response')
  return data.map(model => {
    if (typeof model.id !== 'string' || !model.id.startsWith(`${organization}/`)) throw new Error('Unexpected model owner')
    return {
      id: model.id,
      name: model.id.slice(organization.length + 1),
      modelId: model.id,
      provider: organization,
      url: `https://huggingface.co/${model.id.split('/').map(encodeURIComponent).join('/')}`,
      publishedAt: model.createdAt || null,
      category: 'huggingface',
      openWeights: false
    }
  })
}

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'IndependentModelTracker/1.0', Accept: 'application/json' } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function collectSource(source) {
  if (source === 'models.dev') return catalogRecords(await getJson('https://models.dev/api.json'))
  const organization = source.slice('huggingface:'.length)
  if (!organizations.includes(organization)) throw new Error('Unknown source')
  const params = new URLSearchParams({ author: organization, sort: 'createdAt', direction: '-1', limit: '100' })
  return huggingFaceRecords(await getJson(`https://huggingface.co/api/models?${params}`), organization)
}