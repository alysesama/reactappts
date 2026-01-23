import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, 'env'),
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  server: {
    proxy: {
      '/msr-api': {
        target: 'https://monster-siren.hypergryph.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/msr-api/, ''),
      },
    },
  },
  plugins: [react(), msrImageProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})

function msrImageProxy(): Plugin {
  return {
    name: 'msr-image-proxy',
    configureServer(server) {
      server.middlewares.use('/msr-img', async (req, res, next) => {
        try {
          const u = new URL(req.url ?? '', 'http://localhost')
          const target = u.searchParams.get('url')

          if (!target) {
            res.statusCode = 400
            res.end('Missing url')
            return
          }

          let targetUrl: URL
          try {
            targetUrl = new URL(target)
          } catch {
            res.statusCode = 400
            res.end('Invalid url')
            return
          }

          if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
            res.statusCode = 400
            res.end('Invalid protocol')
            return
          }

          const upstream = await fetch(targetUrl.toString())

          if (!upstream.ok) {
            res.statusCode = upstream.status
            res.end(await upstream.text())
            return
          }

          const contentType = upstream.headers.get('content-type')
          if (contentType) {
            res.setHeader('Content-Type', contentType)
          }
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

          const buf = Buffer.from(await upstream.arrayBuffer())
          res.statusCode = 200
          res.end(buf)
        } catch (e) {
          next(e)
        }
      })
    },
  }
}
