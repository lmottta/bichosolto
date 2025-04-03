import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path, // Não reescrever o caminho
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Erro no proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Requisição sendo enviada para:', proxyReq.path);
            // Log do corpo da requisição para debug
            if (req.body) {
              console.log('Corpo da requisição:', JSON.stringify(req.body));
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Resposta recebida do backend:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})