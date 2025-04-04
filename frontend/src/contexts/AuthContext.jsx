import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
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
          const response = await api.get('/api/users/me')
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

  // Função para buscar dados do usuário (ex: ao carregar a app ou após login)
  const fetchUser = useCallback(async () => {
    setIsLoading(true)
    try {
      // Tenta buscar dados do usuário logado usando a sessão/cookie
      const response = await axios.get('/api/users/me')
      setUser(response.data)
      console.log('Usuário carregado do backend:', response.data)
    } catch (error) {
      // Se der erro (ex: 401 não autorizado), significa que não há sessão válida
      console.log('Nenhuma sessão de usuário ativa encontrada ou erro ao buscar:', error.response?.data?.message || error.message)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar dados do usuário ao montar o provider
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Função de login
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/users/login', { email, password })
      setUser(response.data) // Armazena os dados do usuário retornados pelo login
      setIsAuthenticated(true)
      toast.success('Login realizado com sucesso!')
      return true // Indica sucesso
    } catch (error) {
      console.error("Erro no login:", error.response?.data?.message || error.message)
      setUser(null)
      setIsLoading(false)
      throw error // Re-lança o erro para o componente de login tratar (ex: mostrar toast)
    }
  }, [])

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

  // Função para atualizar informações do usuário (usada pelo UserProfilePage)
  const updateUserInfo = useCallback((newUserInfo) => {
    // Simplesmente atualiza o estado 'user' com os novos dados recebidos da API
    // Certifique-se que newUserInfo contém todos os campos necessários, incluindo profileImageUrl
    console.log('AuthContext: Atualizando informações do usuário:', newUserInfo);
    setUser(prevUser => ({
      ...prevUser, // Mantém campos não atualizados (se houver)
      ...newUserInfo // Sobrescreve com os novos dados
    }));
    return true; // Indica sucesso na atualização do contexto
  }, []);

  // Função de logout
  const logout = useCallback(async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  // Verificar se o usuário tem determinada permissão
  const hasPermission = (requiredRole) => {
    if (!isAuthenticated || !user) return false
    return user.role === requiredRole
  }

  const value = useMemo(() => ({
    user,
    setUser, // Pode ser útil expor setUser diretamente em alguns casos
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
    updateUserInfo,
    fetchUser // Expor fetchUser pode ser útil para revalidar
  }), [user, isAuthenticated, isLoading, login, register, logout, hasPermission, updateUserInfo, fetchUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}