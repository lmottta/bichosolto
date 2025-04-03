import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

// Log de diagnóstico
console.log('Iniciando aplicação')

// Configuração global do Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.request.use(
  config => {
    console.log(`Requisição: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Adicionar listener para mudanças de rota
const logRouteChange = () => {
  console.log(`Navegação: ${window.location.pathname}`)
}

window.addEventListener('popstate', logRouteChange)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </BrowserRouter>
  </React.StrictMode>,
)