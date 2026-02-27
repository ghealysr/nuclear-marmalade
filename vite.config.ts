import { defineConfig, type Plugin, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-only API proxy plugin for Nuke Chat.
 * Proxies /api/chat → Anthropic Messages API using ANTHROPIC_API_KEY env var.
 * In production, replace with a serverless function (Vercel/Netlify/Cloudflare).
 */
function nukeChatProxy(): Plugin {
  return {
    name: 'nuke-chat-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }))
          return
        }

        // Read request body
        let body = ''
        for await (const chunk of req) {
          body += chunk
        }

        try {
          const parsed = JSON.parse(body)

          // Call Anthropic API with streaming
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 256,
              system: parsed.system,
              stream: true,
              messages: parsed.messages.map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          })

          if (!response.ok) {
            const error = await response.text()
            res.writeHead(response.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error }))
            return
          }

          // Stream parsed text content back to client
          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
          })

          const reader = response.body!.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const event = JSON.parse(data)
                  if (event.type === 'content_block_delta' && event.delta?.text) {
                    res.write(event.delta.text)
                  }
                } catch {
                  // Skip unparseable
                }
              }
            }
          }

          res.end()
        } catch (err) {
          console.error('Nuke chat proxy error:', err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load .env so process.env is available in server middleware
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [react(), nukeChatProxy()],
    optimizeDeps: {
      include: ['framer-motion'],
    },
    server: {
      port: 3001,
      host: true,
    },
    build: {
      outDir: 'dist',
    },
  }
})
