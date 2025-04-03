import './utils/disableMixpanel'; // Desabilitar o Mixpanel antes de tudo para evitar erros

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'

// Fallback de carregamento
import LoadingSpinner from './components/common/LoadingSpinner'

// Importação dinâmica do App para melhorar performance de carregamento inicial
const App = lazy(() => import('./App'))

// Componente para capturar erros globais
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo)
    this.setState({ errorInfo })
    
    // Você pode adicionar telemetria ou logs de erro aqui
  }

  handleRefresh = () => {
    // Limpar erros persistentes
    localStorage.removeItem('last_error')
    
    // Recarregar a página
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro inesperado no aplicativo. Tente recarregar a página.
            </p>
            <pre className="bg-gray-100 p-4 rounded text-xs mb-4 overflow-auto max-h-32">
              {this.state.error?.toString() || "Erro desconhecido"}
            </pre>
            <button 
              onClick={this.handleRefresh}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Tratamento de eventos globais não capturados
window.addEventListener('error', (event) => {
  console.error('Erro global não tratado:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promessa rejeitada não tratada:', event.reason)
})

// Otimização para aplicações PWA - precarregamento de páginas
document.addEventListener('DOMContentLoaded', () => {
  // Precarregar rotas principais após o carregamento inicial
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      import('./pages/HomePage')
      import('./pages/auth/LoginPage')
      import('./pages/auth/RegisterPage')
    })
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <AuthProvider>
            <App />
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)