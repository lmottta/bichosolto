import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../api/axios'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('userId')
      
      if (userId) {
        try {
          // Configurar o ID do usuário no cabeçalho das requisições
          axios.defaults.headers.common['Authorization'] = userId
          api.defaults.headers.common['Authorization'] = userId
          
          // Obter informações do usuário
          console.log('Verificando autenticação - userId:', userId)
          const response = await api.get('/api/users/me')
          console.log('Dados do usuário obtidos:', response.data)
          
          // Verificação de dados vazios ou incompletos
          if (!response.data || Object.keys(response.data).length === 0) {
            console.error('Dados do usuário vazios ou incompletos')
            throw new Error('Dados do usuário vazios ou incompletos')
          }
          
          setUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error)
          
          // Tentar novamente com uma requisição direta para resolver problemas de CORS ou cache
          try {
            console.log('Tentando requisição alternativa para obter dados do usuário')
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const directResponse = await fetch(`${API_URL}/api/users/me`, {
              headers: {
                'Authorization': userId
              }
            })
            
            if (directResponse.ok) {
              const userData = await directResponse.json()
              console.log('Dados do usuário obtidos via fetch direto:', userData)
              setUser(userData)
              setIsAuthenticated(true)
            } else {
              throw new Error(`Falha na requisição direta: ${directResponse.status}`)
            }
          } catch (retryError) {
            console.error('Erro na tentativa alternativa:', retryError)
            logout()
          }
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  // Função de login
  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await api.post('/api/auth/login', { email, password })
      const { userId, user } = response.data
      
      // Salvar ID do usuário no localStorage
      localStorage.setItem('userId', userId)
      
      // Configurar o ID do usuário no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = userId
      api.defaults.headers.common['Authorization'] = userId
      
      setUser(user)
      setIsAuthenticated(true)
      toast.success('Login realizado com sucesso!')
      
      return true
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      toast.error(error.response?.data?.message || 'Erro ao fazer login')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função de registro
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
      
      const { userId, user } = response.data;
      
      // Salvar ID do usuário no localStorage
      localStorage.setItem('userId', userId);
      
      // Configurar o ID do usuário no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = userId;
      api.defaults.headers.common['Authorization'] = userId;
      
      setUser(user);
      setIsAuthenticated(true);
      toast.success(response.data.message || 'Cadastro realizado com sucesso!');
      
      // Redirecionar baseado no papel do usuário
      if (user.role === 'ong') {
        navigate('/ong-dashboard');
      } else {
        navigate('/eventos');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      
      // Tentar extrair a mensagem de erro da resposta
      let errorMessage = 'Erro ao realizar cadastro';
      
      if (error.response) {
        // O servidor respondeu com um status de erro
        console.error('Dados da resposta de erro:', error.response.data);
        errorMessage = error.response.data.message || error.response.data.error || 
                      (error.response.data.errors && error.response.data.errors[0] && error.response.data.errors[0].msg) || 
                      `Erro ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Sem resposta do servidor:', error.request);
        errorMessage = 'Servidor não respondeu. Verifique sua conexão de internet.';
      } 
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar informações do usuário
  const updateUserInfo = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Atualizando informações do usuário:', {...userData, password: userData.password ? '*****' : undefined});
      
      const response = await api.put(`/api/users/me`, userData);
      
      if (response.data) {
        setUser({...user, ...response.data});
        toast.success('Informações atualizadas com sucesso!');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar informações');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('userId');
    
    // Limpar cabeçalhos de autenticação
    delete axios.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  // Função para verificar permissões
  const hasPermission = (requiredRole) => {
    if (!isAuthenticated || !user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  // Valor do contexto
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUserInfo,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};