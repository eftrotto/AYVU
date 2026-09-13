import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Em dev, o front roda em localhost:5173 e o backend em localhost:8000.
// O proxy deixa o front chamar caminhos relativos (ex: fetch('/auth/login'))
// sem se preocupar com CORS/URL absoluta — em produção isso é resolvido por
// quem hospeda (mesmo domínio, ou VITE_API_BASE_URL apontando pro backend).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/macu': 'http://127.0.0.1:8000',
      '/reko': 'http://127.0.0.1:8000',
      '/ayvu': 'http://127.0.0.1:8000',
      '/okas': 'http://127.0.0.1:8000',
      '/notas': 'http://127.0.0.1:8000',
    },
  },
})
