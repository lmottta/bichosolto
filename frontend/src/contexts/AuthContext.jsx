import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../api/axios'
import jwtDecode from 'jwt-decode'
import { toast } from 'react-toastify'
import SafeStorage from '../components/common/SafeStorage'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Cache para evitar decodificações repetidas do mesmo token
const tokenValidityCache = new Map();

// Nome da chave usada para o token no armazenamento
const TOKEN_KEY = 'auth_token';

// TTL padrão para tokens em segundos (3 horas)
const DEFAULT_TOKEN_TTL = 3 * 60 * 60;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastTokenCheck, setLastTokenCheck] = useState(0)
  const [tokenCheckEnabled, setTokenCheckEnabled] = useState(true)
  const navigate = useNavigate()

  // Função para verificar se o token é válido (com cache para performance)
  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    
    // Verificar se o resultado já está em cache
    if (tokenValidityCache.has(token)) {
      const cachedResult = tokenValidityCache.get(token);
      // Se o resultado em cache ainda for válido (não expirou desde a última verificação)
      if (cachedResult.timestamp > Date.now()) {
        return cachedResult.isValid;
      }
      // Remover resultado expirado do cache
      tokenValidityCache.delete(token);
    }
    
    try {
      // Verificar se o token expirou
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const isValid = decodedToken.exp > currentTime;
      
      // Guardar resultado em cache (válido por 1 minuto ou até 10 segundos antes da expiração)
      const expiresIn = (decodedToken.exp - currentTime) * 1000;
      const cacheValidityTime = Math.min(60000, Math.max(0, expiresIn - 10000));
      
      if (cacheValidityTime > 0) {
        tokenValidityCache.set(token, {
          isValid,
          timestamp: Date.now() + cacheValidityTime
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      // Não armazenar em cache resultados de erro para permitir novas tentativas
      return false;
    }
  }, []);

  // Obter o token de forma segura
  const getToken = useCallback(() => {
    return SafeStorage.getItem(TOKEN_KEY);
  }, []);

  // Salvar o token de forma segura
  const saveToken = useCallback((token) => {
    try {
      // Decodificar o token para obter a data de expiração
      const decodedToken = jwtDecode(token);
      const expiresIn = decodedToken.exp - (Date.now() / 1000);
      
      // Salvar o token com TTL
      const ttl = Math.max(expiresIn - 60, DEFAULT_TOKEN_TTL); // Expiração - 60 segundos de segurança
      
      console.log(`Salvando token válido por ${Math.round(ttl / 60)} minutos`);
      return SafeStorage.setItem(TOKEN_KEY, token, { ttl });
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      // Fallback: salvar sem metadata ou TTL
      return SafeStorage.setItem(TOKEN_KEY, token);
    }
  }, []);

  // Configuração de token nas requisições
  const setupAxiosInterceptors = useCallback((token) => {
    if (!token) return;
    
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Token configurado nos interceptors');
    } catch (error) {
      console.error('Erro ao configurar token nos interceptors:', error);
    }
  }, []);

  // Verificar se o usuário já está autenticado ao carregar a página - otimizado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        console.log('Verificando autenticação com token:', token ? 'presente' : 'ausente');
        
        // Se não tem token, não está autenticado
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Verificar validade do token - se não for válido, nem tenta fazer requisição
        if (!isTokenValid(token)) {
          console.log('Token inválido ou expirado, fazendo logout silencioso');
          silentLogout();
          setIsLoading(false);
          return;
        }
        
        // Configurar o token no cabeçalho das requisições
        setupAxiosInterceptors(token);
        
        // Obter informações do usuário com tratamento de erros robusto
        try {
          const response = await api.get('/api/users/me');
          if (response?.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            console.log('Usuário autenticado com sucesso');
          } else {
            console.warn('Resposta válida, mas sem dados do usuário');
            silentLogout();
          }
        } catch (fetchError) {
          console.error('Erro ao buscar dados do usuário:', fetchError);
          
          // Somente fazer logout em caso de erro 401 (não autorizado)
          if (fetchError.response && fetchError.response.status === 401) {
            silentLogout();
          } else {
            // Para outros erros, manter o token mas definir como não autenticado temporariamente
            // Isso evita deslogar o usuário devido a problemas de rede temporários
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Erro geral na verificação de autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [getToken, isTokenValid, setupAxiosInterceptors]);

  // Ouvir eventos de mudança de armazenamento
  useEffect(() => {
    // Função para lidar com mudanças no safestorage
    const handleStorageChange = (event) => {
      if (!event.detail) return;
      
      const { key, newValue } = event.detail;
      
      // Se o token foi alterado
      if (key === TOKEN_KEY) {
        if (!newValue) {
          // Token removido
          console.log('Token removido em outra guia');
          setUser(null);
          setIsAuthenticated(false);
        } else if (newValue !== getToken()) {
          // Token alterado
          console.log('Token alterado em outra guia');
          // Recarregar a página para atualizar o estado
          window.location.reload();
        }
      }
    };
    
    // Adicionar listener para o evento personalizado
    window.addEventListener('safestorage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('safestorage', handleStorageChange);
    };
  }, [getToken]);

  // Verificar a validade do token periodicamente de forma otimizada
  useEffect(() => {
    // Só configura o intervalo se a verificação de token estiver habilitada
    if (!tokenCheckEnabled) return;
    
    const interval = setInterval(() => {
      // Evitar verificações desnecessárias quando o usuário já não está autenticado
      if (!isAuthenticated) return;
      
      const token = getToken();
      const now = Date.now();
      
      // Otimização: verificar no máximo uma vez a cada 3 minutos
      if (token && now - lastTokenCheck > 3 * 60 * 1000) {
        if (!isTokenValid(token)) {
          console.log('Token expirou durante a sessão ativa');
          silentLogout();
        }
        setLastTokenCheck(now);
      }
    }, 60 * 1000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, [isAuthenticated, lastTokenCheck, isTokenValid, tokenCheckEnabled, getToken]);

  // Logout silencioso (sem mensagens ou redirecionamentos)
  const silentLogout = useCallback(() => {
    SafeStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    tokenValidityCache.clear();
  }, []);

  // Função de login com segurança aprimorada
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Desabilitar verificação de token durante o login para evitar conflitos
      setTokenCheckEnabled(false);
      
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Verificação robusta de resposta
      if (!token || !user) {
        throw new Error('Token ou dados do usuário não fornecidos pelo servidor');
      }
      
      // Validar token antes de prosseguir
      if (!isTokenValid(token)) {
        throw new Error('Servidor retornou um token inválido ou expirado');
      }
      
      // Salvar token de forma segura
      saveToken(token);
      
      // Configurar o token no cabeçalho das requisições
      setupAxiosInterceptors(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setLastTokenCheck(Date.now());
      toast.success('Login realizado com sucesso!');
      
      // Reativar verificação de token após login bem-sucedido
      setTimeout(() => setTokenCheckEnabled(true), 1000);
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      // Extrair mensagem de erro específica
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
      // Reativar verificação mesmo em caso de erro
      setTimeout(() => setTokenCheckEnabled(true), 1000);
    }
  };

  // Função de registro otimizada
  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Iniciando processo de registro');
      
      // Desabilitar verificação de token durante o registro
      setTokenCheckEnabled(false);
      
      // Sanitizar dados antes de enviar
      const sanitizedData = { ...userData };
      
      // Garantir que os valores de telefone e outros campos estão corretos
      if (typeof sanitizedData.phone === 'string') {
        sanitizedData.phone = sanitizedData.phone.replace(/\D/g, '');
      }
      
      if (sanitizedData.role === 'ong') {
        if (typeof sanitizedData.cnpj === 'string') {
          sanitizedData.cnpj = sanitizedData.cnpj.replace(/\D/g, '');
        }
        
        if (typeof sanitizedData.responsiblePhone === 'string') {
          sanitizedData.responsiblePhone = sanitizedData.responsiblePhone.replace(/\D/g, '');
        }
        
        if (typeof sanitizedData.postalCode === 'string') {
          sanitizedData.postalCode = sanitizedData.postalCode.replace(/\D/g, '');
        }
      } else {
        // Se não for ONG, remover campos específicos
        delete sanitizedData.cnpj;
        delete sanitizedData.description;
        delete sanitizedData.foundingDate;
        delete sanitizedData.website;
        delete sanitizedData.socialMedia;
        delete sanitizedData.responsibleName;
        delete sanitizedData.responsiblePhone;
        delete sanitizedData.postalCode;
      }
      
      console.log('Dados sanitizados para registro:', {...sanitizedData, password: '*****'});
      
      // Log detalhado da requisição
      console.log(`Enviando POST para ${api.defaults.baseURL}/api/auth/register`);
      
      // Tentar a requisição com timeout aumentado e encapsulamento para evitar travamentos
      const response = await Promise.race([
        api.post('/api/auth/register', sanitizedData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout manual - servidor não respondeu em tempo hábil')), 20000)
        )
      ]);
      
      console.log('Resposta recebida com sucesso:', response.status);
      console.log('Dados do usuário:', response.data.user ? {...response.data.user, password: undefined} : 'Sem dados de usuário');
      
      const { token, user } = response.data;
      
      // Verificação robusta de resposta
      if (!token || !user) {
        throw new Error('Token ou dados do usuário não fornecidos pelo servidor');
      }
      
      // Validar token antes de prosseguir
      if (!isTokenValid(token)) {
        throw new Error('Servidor retornou um token inválido ou expirado');
      }
      
      // Salvar token de forma segura
      saveToken(token);
      
      // Configurar o token no cabeçalho das requisições
      setupAxiosInterceptors(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setLastTokenCheck(Date.now());
      toast.success('Cadastro realizado com sucesso!');
      
      // Reativar verificação de token após registro bem-sucedido
      setTimeout(() => setTokenCheckEnabled(true), 1000);
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      
      // Log detalhado de erro
      if (error.response) {
        // O servidor respondeu com um código de status fora do intervalo 2xx
        console.error(`Erro na resposta do servidor: ${error.response.status}`, error.response.data);
      } else if (error.request) {
        // A requisição foi feita mas nenhuma resposta foi recebida
        console.error('Sem resposta do servidor:', error.request);
        
        // Verificar se o backend está em execução
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const testConnection = await fetch(`${API_URL}/api`);
          console.log('Teste de conexão com backend:', testConnection.status);
        } catch (connError) {
          console.error('Backend não está acessível:', connError);
        }
      } else {
        // Algo aconteceu durante a configuração da requisição que desencadeou um erro
        console.error('Erro na configuração da requisição:', error.message);
      }
      
      // Extrair mensagem de erro da resposta da API
      let errorMessage = 'Erro ao fazer cadastro';
      
      if (error.response) {
        console.log('Resposta de erro do servidor:', error.response.status, error.response.data);
        // Se há resposta da API com status de erro
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erros de validação (array de erros)
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else if (error.response.data.message) {
          // Mensagem de erro única
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          // Formato alternativo de erro
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          // Resposta como string
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        console.log('Sem resposta do servidor:', error.request);
        errorMessage = 'Servidor não respondeu. Verifique se o backend está em execução.';
      } else if (error.message) {
        // Erro de rede ou outros erros
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
      // Reativar verificação de token mesmo em caso de erro
      setTimeout(() => setTokenCheckEnabled(true), 1000);
    }
  };

  // Função para atualizar os dados do usuário no contexto - Otimizada
  const updateUserInfo = async (userData) => {
    try {
      setIsLoading(true);
      
      // Se já recebemos os dados do usuário atualizados, economizamos uma requisição
      if (userData) {
        console.log('Atualizando dados do usuário no contexto:', userData);
        setUser(userData);
        return true;
      }
      
      // Caso contrário, buscamos os dados atualizados da API
      console.log('Buscando dados atualizados do usuário na API');
      const response = await api.get('/api/users/me');
      
      if (response?.data) {
        console.log('Dados do usuário buscados da API:', response.data);
        setUser(response.data);
        // Se os dados foram carregados com sucesso, garantimos que o usuário está autenticado
        setIsAuthenticated(true);
        return true;
      } else {
        console.warn('Resposta sem dados de usuário');
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar informações do usuário:', error);
      
      // Se for erro de autorização, fazer logout
      if (error.response && error.response.status === 401) {
        // Usar logout silencioso para evitar redirecionamentos durante a navegação
        silentLogout();
        toast.error('Sessão expirada. Por favor, faça login novamente.');
      } else {
        // Extrair mensagem de erro da resposta da API
        let errorMessage = 'Erro ao atualizar dados do perfil';
        
        if (error.response) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
        
        toast.error(errorMessage);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout com melhor tratamento de redirecionamento
  const logout = useCallback(() => {
    // Limpar todos os dados de autenticação
    silentLogout();
    
    // Lista de páginas públicas
    const publicRoutes = ['/donate', '/volunteer', '/animals', '/events', '/', '/about', '/contact', '/report-abuse'];
    const currentPath = window.location.pathname;
    
    // Verificar se está em uma página pública
    const isPublicPage = publicRoutes.some(route => currentPath.startsWith(route));
    
    // Só redirecionar para login se não estiver em uma página pública
    if (!isPublicPage) {
      navigate('/login');
      toast.info('Você saiu da sua conta');
    } else {
      toast.info('Sessão encerrada');
    }
  }, [navigate, silentLogout]);

  // Verificar se o usuário tem determinada permissão
  const hasPermission = useCallback((requiredRole) => {
    if (!isAuthenticated || !user) return false;
    return user.role === requiredRole;
  }, [isAuthenticated, user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
    updateUserInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};