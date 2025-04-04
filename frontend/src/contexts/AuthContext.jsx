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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
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
      toast.success('Cadastro realizado com sucesso!');
      
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
    }
  };

  // Função para atualizar os dados do usuário no contexto
  const updateUserInfo = async (userData) => {
    try {
      setIsLoading(true)
      
      // Se já recebemos os dados do usuário, apenas atualizamos o state
      if (userData) {
        console.log('Atualizando dados do usuário no contexto:', userData);
        // Adicionar timestamp para evitar cache de imagem
        if (userData.profileImageUrl) {
          const timestamp = new Date().getTime();
          userData.profileImageUrl = `${userData.profileImageUrl}?t=${timestamp}`;
        }
        // Garantir que o usuário seja atualizado com todos os dados
        setUser(prevUser => ({
          ...prevUser,
          ...userData
        }))
        setIsAuthenticated(true) // Garantir que o usuário continue autenticado
        return true
      }
      
      // Caso contrário, buscamos os dados atualizados da API
      const response = await api.get('/api/users/me')
      console.log('Dados do usuário buscados da API:', response.data);
      // Adicionar timestamp para evitar cache de imagem
      if (response.data.profileImageUrl) {
        const timestamp = new Date().getTime();
        response.data.profileImageUrl = `${response.data.profileImageUrl}?t=${timestamp}`;
      }
      // Atualizar o usuário com os dados da API
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }))
      setIsAuthenticated(true) // Garantir que o usuário continue autenticado
      return true
    } catch (error) {
      console.error('Erro ao atualizar informações do usuário:', error)
      
      // Extrair mensagem de erro da resposta da API
      let errorMessage = 'Erro ao atualizar dados do perfil';
      
      if (error.response) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função de logout
  const logout = () => {
    try {
      console.log('Iniciando processo de logout')
      
      // Limpar dados de autenticação do localStorage
      localStorage.removeItem('userId')
      
      // Limpar cabeçalhos de autorização
      delete axios.defaults.headers.common['Authorization']
      delete api.defaults.headers.common['Authorization']
      
      // Atualizar estado do contexto
      setUser(null)
      setIsAuthenticated(false)
      
      // Lista de páginas públicas
      const publicRoutes = ['/donate', '/volunteer', '/animals', '/events', '/', '/about', '/contact', '/report-abuse']
      const currentPath = window.location.pathname
      
      // Verificar se está em uma página pública
      const isPublicPage = publicRoutes.some(route => currentPath.startsWith(route))
      
      console.log('Logout realizado com sucesso. Página atual:', currentPath, 'É página pública:', isPublicPage)
      
      // Só redirecionar para login se não estiver em uma página pública
      if (!isPublicPage) {
        navigate('/login')
        toast.info('Você saiu da sua conta')
      } else {
        toast.info('Sessão encerrada')
      }
    } catch (error) {
      console.error('Erro durante o logout:', error)
      toast.error('Ocorreu um erro ao sair da conta')
    }
  }

  // Verificar se o usuário tem determinada permissão
  const hasPermission = (requiredRole) => {
    if (!isAuthenticated || !user) return false
    return user.role === requiredRole
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
    updateUserInfo
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}