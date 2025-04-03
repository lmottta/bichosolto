import axios from 'axios';

// Função para reconectar em caso de falha na rede
const setupRetry = (config) => {
  // Número máximo de tentativas
  config.retry = 3;
  config.retryDelay = 1000;
  
  return config;
};

// Obtém a URL da API das variáveis de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
console.log('API URL utilizada:', API_URL);

// Criando uma instância do axios com configurações base
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos - reduzido para melhorar a experiência do usuário
  headers: {
    'Content-Type': 'application/json'
  },
  // Evitar cookies e autenticação de CORS para reduzir overhead
  withCredentials: false
});

// Interceptor para logging de requisições e adicionar token se disponível
api.interceptors.request.use(
  (config) => {
    // Log somente em ambiente de desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`Enviando requisição para: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    // Adicionar configuração de retry
    return setupRetry(config);
  },
  (error) => {
    console.error('Erro ao preparar requisição:', error);
    return Promise.reject(error);
  }
);

// Cache para armazenar respostas de requisições GET
const responseCache = new Map();

// Tempo de vida do cache em milissegundos (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// Interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => {
    // Log somente em ambiente de desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`Resposta recebida: ${response.status} ${response.config.url}`);
    }
    
    // Se for uma requisição GET, armazenar no cache
    if (response.config.method === 'get' && !response.config.skipCache) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // Se não há configuração da requisição, não podemos fazer retry
    if (!config) {
      console.error('Erro na requisição (sem retry possível):', error.message);
      return Promise.reject(error);
    }
    
    // Verificar se é erro 401 (não autorizado)
    if (error.response && error.response.status === 401) {
      // A lógica de tratamento de 401 agora está no AuthContext
      console.warn('Erro 401 (Não autorizado) recebido.');
    }
    
    // Número de tentativas restantes
    if (config.retry === undefined) {
      config.retry = 3;
    }
    config.retry--;
    
    // Se for erro de conexão recusada ou timeout, tentamos novamente
    const networkErrors = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'Network Error'];
    const shouldRetry = 
      config.retry > 0 && 
      (networkErrors.includes(error.code) || 
       !error.response || // sem resposta do servidor
       (error.message && error.message.includes('Network Error')));
    
    if (shouldRetry) {
      console.log(`Tentando reconectar (tentativas restantes: ${config.retry})...`);
      
      // Espera antes de tentar novamente (com backoff exponencial)
      const delay = config.retryDelay || 1000;
      config.retryDelay = delay * 2;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Para requisições GET, verificar se há resposta em cache
      if (config.method === 'get' && !config.skipCache) {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        const cachedResponse = responseCache.get(cacheKey);
        
        if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_TTL) {
          console.log('Usando resposta em cache durante falha de rede');
          return Promise.resolve({
            ...error.response,
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK (from cache)',
            fromCache: true
          });
        }
      }
      
      // Tentativa de reconexão
      return api(config);
    }
    
    // Log detalhado do erro
    if (error.response) {
      // O servidor respondeu com um código de status fora do intervalo 2xx
      console.error(`Erro na resposta do servidor: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error('Servidor não respondeu à requisição', error.request);
    } else {
      // Erro durante a configuração da requisição
      console.error('Erro na requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Adicionar método para limpar cache
api.clearCache = (url = null) => {
  if (url) {
    // Limpar entradas específicas do cache
    for (const key of responseCache.keys()) {
      if (key.startsWith(url)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Limpar todo o cache
    responseCache.clear();
  }
};

export default api; 