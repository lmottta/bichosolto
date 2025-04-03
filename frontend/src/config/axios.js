import axios from 'axios';

// Configuração base do axios
axios.defaults.baseURL = 'http://localhost:3000';

// Flag para controlar se estamos navegando manualmente
let isManualNavigation = false;

// Capturar eventos de navegação do usuário
window.addEventListener('click', (event) => {
  const target = event.target;
  
  // Verificar se o clique foi em um link para a página de doação
  if (target.tagName === 'A' && (target.getAttribute('href') === '/donate' || target.pathname === '/donate')) {
    console.log('Navegação manual para /donate detectada');
    isManualNavigation = true;
    setTimeout(() => {
      isManualNavigation = false;
    }, 1000); // Reset depois de 1 segundo
  }
});

// Interceptor para adicionar o token de autenticação
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lista de rotas públicas que não devem redirecionar para login
const publicRoutes = ['/donate', '/volunteer', '/report-abuse', '/animals', '/events'];

// Interceptor para tratamento de erros
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Verificar se o usuário está em uma rota pública
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
      
      // Não redirecionar se estiver em uma rota pública ou se for navegação manual para doação
      if (!isPublicRoute && !isManualNavigation && currentPath !== '/donate') {
        localStorage.removeItem('token');
        console.log('Redirecionando para /login devido a erro 401');
        window.location.href = '/login';
      } else {
        console.log('Erro 401 ignorado em página pública:', currentPath);
      }
    }
    return Promise.reject(error);
  }
);

export default axios; 