import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import jwtDecode from 'jwt-decode'
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
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          // Verificar se o token expirou
          const decodedToken = jwtDecode(token)
          const currentTime = Date.now() / 1000
          
          if (decodedToken.exp < currentTime) {
            // Token expirado
            logout()
            return
          }
          
          // Configurar o token no cabeçalho das requisições
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Obter informações do usuário
          const response = await axios.get('/api/users/me')
          setUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error)
          logout()
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
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      // Salvar token no localStorage
      localStorage.setItem('token', token)
      
      // Configurar o token no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
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
      setIsLoading(true)
      const response = await axios.post('/api/auth/register', userData)
      const { token, user } = response.data
      
      // Salvar token no localStorage
      localStorage.setItem('token', token)
      
      // Configurar o token no cabeçalho das requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      setIsAuthenticated(true)
      toast.success('Cadastro realizado com sucesso!')
      
      return true
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error)
      
      // Extrair mensagem de erro da resposta da API
      let errorMessage = 'Erro ao fazer cadastro';
      
      if (error.response) {
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
      } else if (error.message) {
        // Erro de rede ou outros erros
        errorMessage = error.message;
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

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
      const response = await axios.get('/api/users/me')
      console.log('Dados do usuário buscados da API:', response.data);
      setUser(response.data)
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
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
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