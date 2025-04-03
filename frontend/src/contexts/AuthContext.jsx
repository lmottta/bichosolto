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
    
    // Usar SimpleAuth como método de autenticação
    const authValue = `Bearer SimpleAuth_${userData.id}_${userData.email}`;
    axios.defaults.headers.common['Authorization'] = authValue;
    api.defaults.headers.common['Authorization'] = authValue;
    console.log('Autenticação configurada nos headers');
  }, []);

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        setIsLoading(true);
        
        // Remover tokens antigos
        localStorage.removeItem('token');
        
        // Verificar se há dados de usuário salvos
        const savedUser = safeGetItem(USER_KEY);
        const savedAuthStatus = safeGetItem(AUTH_KEY);
        
        if (savedUser && savedAuthStatus) {
          // Configurar cliente axios
          setupAxiosAuth(savedUser);
          
          // Atualizar estado
          setUser(savedUser);
          setIsAuthenticated(true);
        } else {
          // Limpar autenticação se não há dados completos
          clearAuth();
        }
      } catch (e) {
        console.error('Erro ao verificar autenticação:', e);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [setupAxiosAuth]);

  // Limpar dados de autenticação
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
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      // Verificar se o erro tem uma resposta do servidor
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro com validação de senha
  const register = async (userData) => {
    // Validar senha (pelo menos 6 caracteres)
    if (!userData.password || userData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const response = await api.post('/api/auth/register', userData);
      
      // Verificar se a resposta contém os dados do usuário
      if (!response || !response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // Extrair os dados do usuário com segurança
      const responseData = response.data.user;
      
      if (!responseData) {
        throw new Error('Dados do usuário não fornecidos pelo servidor');
      }
      
      toast.success('Registro realizado com sucesso! Faça login para continuar.');
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      
      let errorMessage = 'Erro ao registrar usuário. Tente novamente.';
      
      // Verificar se o erro tem uma resposta do servidor
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
    toast.info('Logout realizado com sucesso!');
  }, [navigate, clearAuth]);

  // Verificar se usuário tem permissão para determinada rota/ação
  const hasPermission = useCallback((requiredRole) => {
    if (!user) return false;
    
    // Se não há papel requerido, qualquer usuário logado tem permissão
    if (!requiredRole) return true;
    
    // Admin tem acesso a tudo
    if (user.role === 'admin') return true;
    
    // Verificar se o papel do usuário corresponde ao requerido
    return user.role === requiredRole;
  }, [user]);

  // Função para atualizar as informações do usuário no contexto
  const updateUserInfo = useCallback((newUserData) => {
    if (!newUserData) return;
    
    try {
      // Obter os dados atuais do usuário
      const currentUserData = safeGetItem(USER_KEY);
      
      // Mesclar os dados atuais com os novos
      const updatedUserData = { ...currentUserData, ...newUserData };
      
      // Salvar os dados atualizados
      safeSetItem(USER_KEY, updatedUserData);
      
      // Atualizar o estado
      setUser(updatedUserData);
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar informações do usuário:', error);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
        register,
        updateUserInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}