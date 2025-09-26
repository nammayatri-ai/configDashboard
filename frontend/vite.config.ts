/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Proxy authentication endpoints to external dashboard
        '/api/user/login': {
          target: 'https://dashboard.integ.moving.tech/api/dev/bap',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/api/user/logout': {
          target: 'https://dashboard.integ.moving.tech/api/dev/bap',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/api/user/profile': {
          target: 'https://dashboard.integ.moving.tech/api/dev/bap',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // Only proxy specific local backend endpoints for file management
        '/api/files/upload-to-git': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/delete': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/list': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/save': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/update': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/exists': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/files/content': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/config/save': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        },
        '/api/health': {
          target: 'http://localhost:8090',
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'import.meta.env': 'import.meta.env'
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'prod', // No sourcemaps in production
      minify: mode === 'prod' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/remote-config']
          }
        }
      }
    }
  }
})
