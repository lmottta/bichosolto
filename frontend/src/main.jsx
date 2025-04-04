import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './api/axios'

// Log de diagnóstico
console.log('Iniciando aplicação')

// Adicionar listener para mudanças de rota
const logRouteChange = () => {
  console.log(`Navegação: ${window.location.pathname}`)
}

window.addEventListener('popstate', logRouteChange)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)