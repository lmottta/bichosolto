import axios from 'axios';

// Determinar a URL base da API
const getApiBaseUrl = () => {
  // Em produção, buscamos da variável de ambiente ou usamos o caminho relativo
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || '/api';
  }
  // Em desenvolvimento, usamos localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

// Criar uma instância do axios com configurações personalizadas
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log para debug
console.log(`Axios configurado com baseURL: ${api.defaults.baseURL}`);

// Interceptor para requisições
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('Erro de resposta:', error.response.status, error.response.data);
      
      // Tratar erros específicos
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Redirecionar para login se necessário
      }
    } else if (error.request) {
      console.error('Erro de requisição (sem resposta):', error.request);
    } else {
      console.error('Erro ao configurar requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Exportar axios padrão e a instância personalizada
export default api;

// Configuração global do axios padrão
axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.withCredentials = true;

// Configurar interceptadores globais
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Exportar a instância normal do axios também
export { axios }; 