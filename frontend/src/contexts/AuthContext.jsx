import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../api/axios'
import jwtDecode from 'jwt-decode'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastTokenCheck, setLastTokenCheck] = useState(0)
  const navigate = useNavigate()

  // Função para verificar se o token é válido
  const isTokenValid = (token) => {
    if (!token) return false
    
    try {
      // Verificar se o token expirou
      const decodedToken = jwtDecode(token)
      const currentTime = Date.now() / 1000
      
      return decodedToken.exp > currentTime
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return false
    }
  }

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token && isTokenValid(token)) {
        try {
          // Configurar o token no cabeçalho das requisições
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Obter informações do usuário
          const response = await api.get('/api/users/me')
          setUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error)
          if (error.response && error.response.status === 401) {
            // Token inválido ou expirado
            logout()
          }
        }
      } else if (token) {
        // Token existe mas é inválido
        logout()
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  // Verificar a validade do token periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token')
      const now = Date.now()
      
      // Só faz a verificação se o token existir e se passou pelo menos 5 minutos desde a última verificação
      if (token && now - lastTokenCheck > 5 * 60 * 1000) {
        if (!isTokenValid(token)) {
          console.log('Token expirou durante a sessão ativa')
          logout()
        }
        setLastTokenCheck(now)
      }
    }, 60 * 1000) // Verificar a cada minuto
    
    return () => clearInterval(interval)
  }, [lastTokenCheck])

  // Função de login
  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      if (!token) {
        throw new Error('Token não fornecido pelo servidor')
      }
      
      // Salvar token no localStorage
      localStorage.setItem('token', token)
      
      // Configurar o token no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      setIsAuthenticated(true)
      setLastTokenCheck(Date.now())
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
      
      const { token, user } = response.data;
      
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      
      // Configurar o token no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
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
        setUser(userData)
        return true
      }
      
      // Caso contrário, buscamos os dados atualizados da API
      const response = await api.get('/api/users/me')
      console.log('Dados do usuário buscados da API:', response.data);
      setUser(response.data)
      return true
    } catch (error) {
      console.error('Erro ao atualizar informações do usuário:', error)
      
      // Se for erro de autorização, fazer logout
      if (error.response && error.response.status === 401) {
        logout()
        toast.error('Sessão expirada. Por favor, faça login novamente.')
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
        
        toast.error(errorMessage)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
    
    // Lista de páginas públicas
    const publicRoutes = ['/donate', '/volunteer', '/animals', '/events', '/', '/about', '/contact', '/report-abuse']
    const currentPath = window.location.pathname
    
    // Verificar se está em uma página pública
    const isPublicPage = publicRoutes.some(route => currentPath.startsWith(route))
    
    // Só redirecionar para login se não estiver em uma página pública
    if (!isPublicPage) {
      navigate('/login')
      toast.info('Você saiu da sua conta')
    } else {
      toast.info('Sessão encerrada')
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