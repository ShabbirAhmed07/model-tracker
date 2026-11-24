import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { collectSource, sourceNames } from './sources.mjs'
import { failSource, initialState, updateSource } from './state.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDirectory = join(root, 'data')
const statePath = join(dataDirectory, 'state.json')
await mkdir(dataDirectory, { recursive: true })
let state
try {
  state = JSON.parse(await readFile(statePath, 'utf8'))
  if (state.version !== 1 || !state.sources || !Array.isArray(state.events)) throw new Error('Unsupported state file')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  state = initialState()
}

for (const source of sourceNames) {
  const observedAt = new Date().toISOString()
  try {
    const records = await collectSource(source)
    updateSource(state, source, records, observedAt)
    console.log(`${source}: ${records.length} records`)
  } catch (error) {
    failSource(state, source, observedAt, error.message)
    console.error(`${source}: ${error.message}`)
  }
}

const generatedAt = new Date().toISOString()
const sources = Object.fromEntries(Object.entries(state.sources).map(([name, { lastAttempt, lastSuccess, error }]) => [name, { lastAttempt, lastSuccess, error }]))
const feed = { generatedAt, sources, events: state.events }
await writeFile(`${statePath}.tmp`, `${JSON.stringify(state, null, 2)}\n`)
await import('node:fs/promises').then(fs => fs.rename(`${statePath}.tmp`, statePath))
await writeFile(join(dataDirectory, 'feed.json'), `${JSON.stringify(feed, null, 2)}\n`)
if (!Object.values(sources).some(source => source.lastSuccess)) process.exitCode = 1