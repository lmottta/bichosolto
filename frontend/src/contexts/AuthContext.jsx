import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../api/axios'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Chaves para armazenamento local
const USER_KEY = 'auth_user';
const AUTH_KEY = 'auth_status';

// Função simples para armazenar informações no localStorage com tratamento de erros
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Erro ao salvar ${key}:`, e);
    return false;
  }
};

// Função para obter informações do localStorage com tratamento de erros
const safeGetItem = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error(`Erro ao obter ${key}:`, e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Configuração de autenticação nas requisições
  const setupAxiosAuth = useCallback((userData) => {
    if (!userData) {
      delete axios.defaults.headers.common['Authorization'];
      delete api.defaults.headers.common['Authorization'];
      return;
    }
    
    const authValue = `Bearer SimpleAuth_${userData.id}_${userData.email}`;
    axios.defaults.headers.common['Authorization'] = authValue;
    api.defaults.headers.common['Authorization'] = authValue;
    console.log('Autenticação configurada nos headers');
  }, []);

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se há dados de autenticação salvos
        const savedUser = safeGetItem(USER_KEY);
        const isUserAuth = safeGetItem(AUTH_KEY);
        
        console.log('Verificando autenticação:', isUserAuth ? 'autenticado' : 'não autenticado');
        
        if (!savedUser || !isUserAuth) {
          console.log('Dados de autenticação não encontrados');
          setIsLoading(false);
          return;
        }
        
        // Configurar a autenticação nas requisições
        setupAxiosAuth(savedUser);
        
        // Verificar com o servidor se a sessão ainda é válida
        try {
          const response = await api.get('/api/users/me');
          
          // Verificar se a resposta tem dados válidos
          if (response && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            // Atualizar os dados salvos caso o servidor tenha retornado dados atualizados
            safeSetItem(USER_KEY, response.data);
            console.log('Autenticação restaurada com sucesso');
          } else {
            console.warn('Resposta válida, mas sem dados do usuário');
            clearAuth();
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          clearAuth();
        }
      } catch (error) {
        console.error('Erro geral na verificação de autenticação:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [setupAxiosAuth, clearAuth]);

  // Função para limpar dados de autenticação
  const clearAuth = useCallback(() => {
    try {
      // Remover dados de localStorage
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(AUTH_KEY);
      
      // Limpar headers de autenticação
      delete axios.defaults.headers.common['Authorization'];
      delete api.defaults.headers.common['Authorization'];
      
      // Atualizar estado do contexto
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('Dados de autenticação limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
      // Garantir que o estado do contexto seja atualizado mesmo em caso de erro
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Função de login simplificada
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/api/auth/login', { email, password });
      
      // Verificar se a resposta contém os dados do usuário
      if (!response || !response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // Extrair os dados do usuário com segurança
      const userData = response.data.user;
      
      // Verificação dos dados do usuário
      if (!userData) {
        throw new Error('Dados do usuário não fornecidos pelo servidor');
      }
      
      // Salvar dados do usuário e status de autenticação
      safeSetItem(USER_KEY, userData);
      safeSetItem(AUTH_KEY, true);
      
      // Configurar headers de autenticação
      setupAxiosAuth(userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login realizado com sucesso!');
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      // Extrair mensagem de erro específica
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        errorMessage = 'Servidor não respondeu. Verifique se o backend está em execução.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro simplificada
  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Iniciando processo de registro');
      
      // Sanitizar dados antes de enviar
      const sanitizedData = { ...userData };
      
      // Garantir que os valores de telefone e outros campos estão corretos
      if (typeof sanitizedData.phone === 'string') {
        sanitizedData.phone = sanitizedData.phone.replace(/\D/g, '');
      }
      
      if (sanitizedData.role === 'ong') {
        // Sanitização para campos de ONG
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
      
      // Tentar a requisição com timeout 
      const response = await api.post('/api/auth/register', sanitizedData);
      
      // Verificar se a resposta contém os dados do usuário
      if (!response || !response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // Extrair os dados do usuário com segurança
      const userData = response.data.user;
      
      // Verificação dos dados do usuário
      if (!userData) {
        throw new Error('Dados do usuário não fornecidos pelo servidor');
      }
      
      // Salvar dados do usuário e status de autenticação
      safeSetItem(USER_KEY, userData);
      safeSetItem(AUTH_KEY, true);
      
      // Configurar headers de autenticação
      setupAxiosAuth(userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Cadastro realizado com sucesso!');
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      
      // Extrair mensagem de erro da resposta da API
      let errorMessage = 'Erro ao fazer cadastro';
      
      if (error.response) {
        console.log('Resposta de erro do servidor:', error.response.status, error.response.data);
        // Se há resposta da API com status de erro
        if (error.response.data && error.response.data.errors && error.response.data.errors.length > 0) {
          // Erros de validação (array de erros)
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else if (error.response.data && error.response.data.message) {
          // Mensagem de erro única
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          // Formato alternativo de erro
          errorMessage = error.response.data.error;
        } else if (error.response.data && typeof error.response.data === 'string') {
          // Resposta como string
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        errorMessage = 'Servidor não respondeu. Verifique se o backend está em execução.';
      } else if (error.message) {
        // Erro de rede ou outros erros
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar os dados do usuário no contexto
  const updateUserInfo = async (userData) => {
    try {
      setIsLoading(true);
      
      // Se já recebemos os dados do usuário atualizados, economizamos uma requisição
      if (userData) {
        console.log('Atualizando dados do usuário no contexto:', userData);
        setUser(userData);
        safeSetItem(USER_KEY, userData);
        return true;
      }
      
      // Caso contrário, buscamos os dados atualizados da API
      console.log('Buscando dados atualizados do usuário na API');
      const response = await api.get('/api/users/me');
      
      if (response?.data) {
        console.log('Dados do usuário buscados da API:', response.data);
        setUser(response.data);
        safeSetItem(USER_KEY, response.data);
        // Se os dados foram carregados com sucesso, garantimos que o usuário está autenticado
        setIsAuthenticated(true);
        safeSetItem(AUTH_KEY, true);
        return true;
      } else {
        console.warn('Resposta sem dados de usuário');
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar informações do usuário:', error);
      
      // Se for erro de autorização, fazer logout
      if (error.response && error.response.status === 401) {
        // Limpar autenticação
        clearAuth();
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

  // Função de logout
  const logout = useCallback(() => {
    // Limpar dados de autenticação
    clearAuth();
    
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
  }, [navigate, clearAuth]);

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