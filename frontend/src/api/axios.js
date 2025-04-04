import axios from 'axios';

// HARD-CODE temporário da URL para garantir funcionamento
const API_URL = 'https://bichosoltobackend-production.up.railway.app';

// Criando uma instância simplificada do axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Remover completamente qualquer referência a localStorage/userId
api.interceptors.request.use(
  (config) => {
    // Log com a URL completa para verificar 
    console.log(`REQUISIÇÃO: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Log de resposta simplificado
api.interceptors.response.use(
  (response) => {
    console.log(`RESPOSTA: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('ERRO API:', error.message);
    return Promise.reject(error);
  }
);

// Log para verificar a configuração no momento da exportação
console.log('AXIOS CONFIG - URL BASE CONFIGURADA:', API_URL);

export default api;