import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'

// Certifique-se que em algum lugar (main.jsx ou App.jsx ou api/axios.js) você tenha:
// axios.defaults.baseURL = import.meta.env.VITE_API_URL; // Deve apontar para o backend!
// axios.defaults.withCredentials = true;

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Função para buscar dados do usuário via sessão/cookie
  const fetchUser = useCallback(async () => {
    console.log('AuthContext: Tentando buscar usuário via sessão...')
    // Não precisa setar isLoading aqui se já setamos no useEffect inicial
    try {
      // A requisição GET /api/users/me usará o cookie de sessão automaticamente
      const response = await api.get('/api/users/me')
      setUser(response.data)
      console.log('AuthContext: Usuário carregado via sessão:', response.data)
    } catch (error) {
      // Erro 401 (Não autorizado) é esperado se não houver sessão válida
      if (error.response && error.response.status === 401) {
        console.log('AuthContext: Nenhuma sessão de usuário ativa encontrada.')
      } else {
        // Outros erros (rede, servidor backend offline, etc.)
        console.error('AuthContext: Erro ao buscar usuário:', error.response?.data?.message || error.message)
      }
      setUser(null) // Garante que o usuário seja nulo se a busca falhar
    } finally {
      // Garante que o loading termine após a tentativa
      // Colocar setIsLoading(false) aqui garante que ele só roda uma vez
      // Se fetchUser for chamado de novo, talvez precise de um setIsLoading(true) no início dela
    }
  }, [])

  // Verificar sessão ao carregar a aplicação
  useEffect(() => {
    setIsLoading(true) // Inicia carregando
    fetchUser().finally(() => {
      setIsLoading(false) // Termina carregando após a busca inicial
    })
  }, [fetchUser])

  // Função de login
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      // A resposta do login DEVE conter os dados do usuário
      const response = await api.post('/api/users/login', { email, password })
      setUser(response.data) // Armazena os dados retornados (incluindo profileImageUrl)
      setIsLoading(false)
      toast.success('Login realizado com sucesso!')
      // Navegar para o perfil ou dashboard após login
      navigate('/profile') // Ou para onde desejar redirecionar
      return true
    } catch (error) {
      console.error("Erro no login:", error.response?.data?.message || error.message)
      setUser(null)
      setIsLoading(false)
      toast.error(error.response?.data?.message || 'Erro ao tentar fazer login.')
      // Não relançar o erro aqui se já estamos tratando com toast
      return false // Indica falha
    }
  }, [navigate])

  // Função de registro (adaptada para sessão)
  // Assumindo que /api/auth/register NÃO faz login automático (não retorna dados/cria sessão)
  // Se fizer, adaptar como a função login
  const register = async (userData) => {
    setIsLoading(true)
    try {
      console.log('Enviando POST para /api/auth/register') // Ajustar endpoint se necessário
      // A rota de registro pode ou não retornar os dados do usuário ou criar sessão
      // Se não criar sessão, o usuário precisará fazer login após o registro
      const response = await api.post('/api/users/register', userData) // Ajuste a rota se necessário

      console.log('Registro bem-sucedido:', response.data)
      toast.success(response.data.message || 'Cadastro realizado com sucesso! Faça login para continuar.')
      // Não definir usuário ou isAuthenticated aqui, a menos que a API de registro
      // retorne os dados do usuário E crie a sessão (faça login automático)
      // Se não fizer login automático:
      // setUser(null);
      // navigate('/login'); // Redireciona para login
      return true // Indica sucesso no registro
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message ||
        (error.response?.data?.errors ? error.response.data.errors.map(e => e.msg).join(', ') : null) ||
        'Erro ao fazer cadastro.'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar informações do usuário
  const updateUserInfo = useCallback((newUserInfo) => {
    console.log('AuthContext: Atualizando informações do usuário no estado:', newUserInfo)
    setUser(prevUser => {
      if (!prevUser) return newUserInfo // Caso raro: atualização sem usuário prévio?
      return {
        ...prevUser,
        ...newUserInfo
      }
    })
    // Não precisa retornar nada, a atualização do estado é o efeito
  }, [])

  // Função de logout
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('AuthContext: Iniciando processo de logout')
      // Chamar endpoint de logout no backend para destruir a sessão
      await api.post('/api/users/logout') // Crie este endpoint se não existir
      console.log('AuthContext: Sessão backend destruída (esperado).')
    } catch (error) {
      // Mesmo que a chamada ao backend falhe, limpe o estado local
      console.error('AuthContext: Erro ao chamar /api/users/logout (ou endpoint não existe):', error.response?.data || error.message)
    } finally {
      // Limpar estado local independentemente do sucesso do backend
      setUser(null)
      setIsLoading(false)
      console.log('AuthContext: Estado local limpo.')
      toast.info('Você saiu da sua conta.')
      navigate('/login') // Redireciona sempre para login após logout
    }
  }, [navigate])

  // Derivar isAuthenticated do estado 'user'
  const isAuthenticated = useMemo(() => user !== null, [user])

  const value = useMemo(() => ({
    user,
    // setUser, // Expor setUser diretamente é geralmente desencorajado
    isAuthenticated,
    isLoading,
    login,
    register, // Manter se aplicável
    logout,
    updateUserInfo, // Passar a função de atualização
    fetchUser // Pode ser útil para revalidar manualmente
  }), [user, isAuthenticated, isLoading, login, register, logout, updateUserInfo, fetchUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}