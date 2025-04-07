import axios from 'axios';

// Função para reconectar em caso de falha na rede
const setupRetry = (config) => {
  // Número máximo de tentativas
  config.retry = 3;
  config.retryDelay = 1000;
  
  return config;
};

<<<<<<< HEAD
// Criando uma instância do axios com configurações base
const api = axios.create({
  baseURL: 'http://localhost:5001',
=======
// Obtém a URL da API das variáveis de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('API URL utilizada:', API_URL);

// Criando uma instância do axios com configurações base
const api = axios.create({
  baseURL: API_URL,
>>>>>>> 5ad50e17d8486eddfaa4d6a8042fba99f8aa63c1
  timeout: 15000, // 15 segundos (aumentado para dar mais tempo ao servidor)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logging de requisições
api.interceptors.request.use(
  (config) => {
    console.log(`Enviando requisição para: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
<<<<<<< HEAD
=======
    // Verificar se há um ID de usuário no localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Adicionar cabeçalho de autorização
      config.headers['Authorization'] = userId;
      console.log('Cabeçalho Authorization adicionado:', userId);
      
      // Verificar se estamos no Railway (produção)
      const isProduction = window.location.hostname !== 'localhost';
      if (isProduction) {
        // Adicionar cabeçalhos alternativos para garantir compatibilidade
        config.headers['X-User-Id'] = userId;
        config.headers['x-user-id'] = userId;
        console.log('Cabeçalhos adicionais de autorização adicionados para produção');
      }
    } else {
      console.log('Requisição sem autorização (nenhum userId no localStorage)');
    }
    
>>>>>>> 5ad50e17d8486eddfaa4d6a8042fba99f8aa63c1
    // Adicionar configuração de retry
    return setupRetry(config);
  },
  (error) => {
    console.error('Erro ao preparar requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => {
    console.log(`Resposta recebida: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // Se não há configuração da requisição, não podemos fazer retry
    if (!config || !config.retry) {
      console.error('Erro na requisição (sem retry possível):', error.message);
      return Promise.reject(error);
    }
    
    // Número de tentativas restantes
    config.retry -= 1;
    
    // Se for erro de conexão recusada ou timeout, tentamos novamente
    const networkErrors = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'Network Error'];
    const shouldRetry = 
      config.retry > 0 && 
      (networkErrors.includes(error.code) || (error.message && error.message.includes('Network Error')));
    
    if (shouldRetry) {
      console.log(`Tentando reconectar (tentativas restantes: ${config.retry})...`);
      
      // Espera antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      
      // Aumenta o delay para a próxima tentativa
      config.retryDelay = config.retryDelay * 2;
      
      // Tentativa de reconexão
      return api(config);
    }
    
    // Log detalhado do erro
    console.error('Erro na requisição:', error);
    
    // Se o erro for de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout na requisição - o servidor demorou muito para responder');
    }
    
    // Se o erro for de rede
    if (error.message === 'Network Error') {
      console.error('Erro de rede. Verifique se o servidor está rodando e acessível.');
      
      // Tentar fazer uma requisição simples para verificar se o servidor está acessível
      try {
<<<<<<< HEAD
        await fetch('http://localhost:5001/api');
=======
        await fetch(`${API_URL}/api`);
>>>>>>> 5ad50e17d8486eddfaa4d6a8042fba99f8aa63c1
        console.log('Servidor está acessível, mas a requisição específica falhou');
      } catch (testError) {
        console.error('Servidor não está acessível:', testError);
      }
    }
    
    return Promise.reject(error);
  }
);

<<<<<<< HEAD
export default api; 
=======
export default api;
>>>>>>> 5ad50e17d8486eddfaa4d6a8042fba99f8aa63c1
