import axios from 'axios';

// Criar uma instância do axios com configurações personalizadas
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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