import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Carregar variáveis de ambiente com base no modo
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5001'
  
  console.log(`Modo: ${mode}, API URL: ${apiUrl}`)
  
  return {
    plugins: [
      react({
        // Configurações otimizadas do React
        fastRefresh: true,
        jsxRuntime: 'automatic',
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Configurar proxy para evitar problemas de CORS
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      // Otimizações de build
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4kb
      rollupOptions: {
        output: {
          manualChunks: {
            // Dividir em chunks para melhorar carregamento
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['react-toastify'],
          },
        },
      },
    },
    optimizeDeps: {
      // Pré-bundling destas dependências para melhorar o carregamento inicial
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'jwt-decode',
        'react-toastify',
      ],
      // Evita que o Vite tente processar estes pacotes
      exclude: [],
    },
    // Configurações específicas para cada ambiente
    define: {
      __APP_ENV__: JSON.stringify(mode),
      // Versão da aplicação para ajudar no debug
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  }
})