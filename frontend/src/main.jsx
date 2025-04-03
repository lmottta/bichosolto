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
  }

  handleRefresh = () => {
    // Limpar qualquer estado persistente que possa causar problemas
    localStorage.removeItem('last_error')
    localStorage.removeItem('token')
    
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

// Função para iniciar a aplicação React
const safeInitialize = () => {
  try {
    // Limpar tokens e dados de autenticação antigos
    localStorage.removeItem('token')
    
    // Iniciar a aplicação com tratamento de erros
    const root = document.getElementById('root');
    if (!root) {
      console.error('Elemento root não encontrado');
      return;
    }
    
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullScreen message="Carregando aplicação..." />}>
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
      </React.StrictMode>
    );
  } catch (e) {
    console.error('Erro durante inicialização:', e);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h2>Erro durante carregamento</h2>
          <p>Ocorreu um problema ao iniciar a aplicação.</p>
          <button onclick="window.location.reload()" style="padding: 10px 15px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Tentar Novamente
          </button>
        </div>
      `;
    }
  }
};

// Executar inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
  safeInitialize();
}