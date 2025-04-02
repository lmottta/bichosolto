import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Verificar se há um redirecionamento da página anterior
  const from = location.state?.from || '/'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const success = await login(formData.email, formData.password)
      
      if (success) {
        // Redirecionar para a página anterior ou para a página inicial
        navigate(from)
      } else {
        // Se o login falhou mas não lançou exceção (tratado internamente na função login)
        setErrors({
          general: 'Credenciais inválidas. Verifique seu e-mail e senha.'
        })
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      
      // Obter mensagem de erro específica da API, se disponível
      let errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 401) {
          errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
        }
      }
      
      setErrors({
        general: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container py-8">
      <div className="card w-full max-w-md mx-auto bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-6">Entrar no Animal Rescue Hub</h2>
          
          {errors.general && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">E-mail</span>
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com" 
                className={`input input-bordered ${errors.email ? 'input-error' : ''}`} 
              />
              {errors.email && <span className="text-error text-sm mt-1">{errors.email}</span>}
            </div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Senha</span>
              </label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********" 
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`} 
              />
              {errors.password && <span className="text-error text-sm mt-1">{errors.password}</span>}
              <label className="label">
                <Link to="/forgot-password" className="label-text-alt link link-hover">
                  Esqueceu a senha?
                </Link>
              </label>
            </div>
            
            <div className="form-control mt-6">
              <button 
                type="submit" 
                className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
          
          <div className="divider">OU</div>
          
          <p className="text-center">
            Não tem uma conta? <Link to="/register" className="link link-primary">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage