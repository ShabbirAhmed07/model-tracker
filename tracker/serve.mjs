import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const files = {
  '/': ['web/index.html', 'text/html; charset=utf-8'],
  '/index.html': ['web/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['web/app.js', 'text/javascript; charset=utf-8'],
  '/share.js': ['web/share.js', 'text/javascript; charset=utf-8'],
  '/card.js': ['web/card.js', 'text/javascript; charset=utf-8'],
  '/ai-insta-logo.png': ['web/ai-insta-logo.png', 'image/png'],
  '/styles.css': ['web/styles.css', 'text/css; charset=utf-8'],
  '/data/feed.json': ['data/feed.json', 'application/json; charset=utf-8']
}
const server = createServer(async (request, response) => {
  const entry = files[new URL(request.url, 'http://localhost').pathname]
  if (!entry) {
    response.writeHead(404).end('Not found')
    return
  }
  try {
    const body = await readFile(join(root, entry[0]))
    response.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' }).end(body)
  } catch {
    response.writeHead(404).end('Run npm run scan to create the feed')
  }
})
server.listen(Number(process.env.PORT || 5180), '127.0.0.1', () => console.log(`Model Signal: http://127.0.0.1:${server.address().port}/`))