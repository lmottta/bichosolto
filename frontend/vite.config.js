import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente com base no modo (dev/prod)
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
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
    },
    build: {
      // Otimizações para produção
      minify: 'terser',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['daisyui', '@heroicons/react']
          }
        }
      }
    }
  }
})