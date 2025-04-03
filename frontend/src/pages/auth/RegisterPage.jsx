import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { formatCpfInput, formatPhoneInput, formatCepInput, formatCnpjInput } from '../../utils/inputFormatters'
import axios from 'axios'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user', // Padrão: usuário comum
    // Campos específicos para ONG
    cnpj: '',
    description: '',
    foundingDate: '',
    website: '',
    socialMedia: '',
    responsibleName: '',
    responsiblePhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Aplicar formatação específica para cada campo
    if (name === 'phone') {
      setFormData({
        ...formData,
        [name]: formatPhoneInput(value)
      })
    } else if (name === 'cnpj') {
      setFormData({
        ...formData,
        [name]: formatCnpjInput(value)
      })
    } else if (name === 'responsiblePhone') {
      setFormData({
        ...formData,
        [name]: formatPhoneInput(value)
      })
    } else if (name === 'postalCode') {
      setFormData({
        ...formData,
        [name]: formatCepInput(value)
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  // Função para buscar endereço pelo CEP
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    
    if (cep.length === 8) {
      try {
        setIsSubmitting(true)
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)
        
        if (!response.data.erro) {
          setFormData({
            ...formData,
            address: response.data.logradouro,
            city: response.data.localidade,
            state: response.data.uf
          })
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido'
    }

    // Validações específicas para ONG
    if (formData.role === 'ong') {
      if (!formData.cnpj) {
        newErrors.cnpj = 'CNPJ é obrigatório'
      } else if (formData.cnpj.replace(/\D/g, '').length !== 14) {
        newErrors.cnpj = 'CNPJ inválido'
      }
      
      if (!formData.description) {
        newErrors.description = 'Descrição é obrigatória'
      }
      if (!formData.responsibleName) {
        newErrors.responsibleName = 'Nome do responsável é obrigatório'
      }
      
      if (!formData.responsiblePhone) {
        newErrors.responsiblePhone = 'Telefone do responsável é obrigatório'
      } else if (formData.responsiblePhone.replace(/\D/g, '').length < 10) {
        newErrors.responsiblePhone = 'Telefone do responsável inválido'
      }
      
      if (!formData.address) {
        newErrors.address = 'Endereço é obrigatório'
      }
      if (!formData.city) {
        newErrors.city = 'Cidade é obrigatória'
      }
      if (!formData.state) {
        newErrors.state = 'Estado é obrigatório'
      }
      if (!formData.postalCode) {
        newErrors.postalCode = 'CEP é obrigatório'
      } else if (formData.postalCode.replace(/\D/g, '').length !== 8) {
        newErrors.postalCode = 'CEP inválido'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Remover confirmPassword antes de enviar para a API
      const { confirmPassword, ...userData } = formData
      
      // Formatar dados antes de enviar
      const formattedData = {
        ...userData,
        phone: userData.phone ? userData.phone.replace(/\D/g, '') : '',
        cnpj: userData.cnpj ? userData.cnpj.replace(/\D/g, '') : undefined,
        responsiblePhone: userData.responsiblePhone ? userData.responsiblePhone.replace(/\D/g, '') : undefined,
        postalCode: userData.postalCode ? userData.postalCode.replace(/\D/g, '') : undefined
      }
      
      // Remover campos undefined ou vazios para ONGs se o usuário for comum
      if (formattedData.role !== 'ong') {
        delete formattedData.cnpj
        delete formattedData.description
        delete formattedData.foundingDate
        delete formattedData.website
        delete formattedData.socialMedia
        delete formattedData.responsibleName
        delete formattedData.responsiblePhone
        delete formattedData.address
        delete formattedData.city
        delete formattedData.state
        delete formattedData.postalCode
      }
      
      console.log('Dados formatados para envio:', formattedData)
      
      const success = await register(formattedData)
      
      if (success) {
        navigate('/')
      }
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error)
      
      // Obter mensagem de erro específica da API, se disponível
      let errorMessage = 'Ocorreu um erro ao fazer cadastro. Tente novamente.'
      
      if (error.response) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erro de validação da API
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ')
        } else if (error.response.data.message) {
          // Mensagem de erro genérica da API
          errorMessage = error.response.data.message
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
      <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-6">Cadastre-se no Animal Rescue Hub</h2>
          
          {errors.general && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nome completo</span>
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo" 
                  className={`input input-bordered ${errors.name ? 'input-error' : ''}`} 
                />
                {errors.name && <span className="text-error text-sm mt-1">{errors.name}</span>}
              </div>
              
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
              
              <div className="form-control">
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
                  autoComplete="new-password"
                />
                {errors.password && <span className="text-error text-sm mt-1">{errors.password}</span>}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirmar senha</span>
                </label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="********" 
                  className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <span className="text-error text-sm mt-1">{errors.confirmPassword}</span>}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Telefone</span>
                </label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000" 
                  className={`input input-bordered ${errors.phone ? 'input-error' : ''}`} 
                />
                {errors.phone && <span className="text-error text-sm mt-1">{errors.phone}</span>}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tipo de conta</span>
                </label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="user">Usuário comum</option>
                  <option value="ong">Representante de ONG</option>
                </select>
                <span className="text-sm mt-1 text-gray-500">
                  Contas de ONG passarão por verificação antes da aprovação
                </span>
              </div>
            </div>

            {/* Campos específicos para ONG */}
            {formData.role === 'ong' && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informações da ONG</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">CNPJ</span>
                    </label>
                    <input 
                      type="text" 
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00" 
                      className={`input input-bordered ${errors.cnpj ? 'input-error' : ''}`} 
                    />
                    {errors.cnpj && <span className="text-error text-sm mt-1">{errors.cnpj}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Data de Fundação</span>
                    </label>
                    <input 
                      type="date" 
                      name="foundingDate"
                      value={formData.foundingDate}
                      onChange={handleChange}
                      className={`input input-bordered ${errors.foundingDate ? 'input-error' : ''}`} 
                    />
                    {errors.foundingDate && <span className="text-error text-sm mt-1">{errors.foundingDate}</span>}
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Descrição da ONG</span>
                    </label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Descreva brevemente a missão e os objetivos da sua ONG" 
                      className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`} 
                    />
                    {errors.description && <span className="text-error text-sm mt-1">{errors.description}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Website</span>
                    </label>
                    <input 
                      type="url" 
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.seusite.com.br" 
                      className={`input input-bordered ${errors.website ? 'input-error' : ''}`} 
                    />
                    {errors.website && <span className="text-error text-sm mt-1">{errors.website}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Redes Sociais</span>
                    </label>
                    <input 
                      type="text" 
                      name="socialMedia"
                      value={formData.socialMedia}
                      onChange={handleChange}
                      placeholder="@suaong" 
                      className={`input input-bordered ${errors.socialMedia ? 'input-error' : ''}`} 
                    />
                    {errors.socialMedia && <span className="text-error text-sm mt-1">{errors.socialMedia}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nome do Responsável</span>
                    </label>
                    <input 
                      type="text" 
                      name="responsibleName"
                      value={formData.responsibleName}
                      onChange={handleChange}
                      placeholder="Nome do responsável legal" 
                      className={`input input-bordered ${errors.responsibleName ? 'input-error' : ''}`} 
                    />
                    {errors.responsibleName && <span className="text-error text-sm mt-1">{errors.responsibleName}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Telefone do Responsável</span>
                    </label>
                    <input 
                      type="text" 
                      name="responsiblePhone"
                      value={formData.responsiblePhone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000" 
                      className={`input input-bordered ${errors.responsiblePhone ? 'input-error' : ''}`} 
                    />
                    {errors.responsiblePhone && <span className="text-error text-sm mt-1">{errors.responsiblePhone}</span>}
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Endereço</span>
                    </label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Endereço completo" 
                      className={`input input-bordered ${errors.address ? 'input-error' : ''}`} 
                    />
                    {errors.address && <span className="text-error text-sm mt-1">{errors.address}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cidade</span>
                    </label>
                    <input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Sua cidade" 
                      className={`input input-bordered ${errors.city ? 'input-error' : ''}`} 
                    />
                    {errors.city && <span className="text-error text-sm mt-1">{errors.city}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Estado</span>
                    </label>
                    <input 
                      type="text" 
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Seu estado" 
                      className={`input input-bordered ${errors.state ? 'input-error' : ''}`} 
                    />
                    {errors.state && <span className="text-error text-sm mt-1">{errors.state}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">CEP</span>
                    </label>
                    <input 
                      type="text" 
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      onBlur={handleCepBlur}
                      placeholder="00000-000" 
                      className={`input input-bordered ${errors.postalCode ? 'input-error' : ''}`} 
                    />
                    {errors.postalCode && <span className="text-error text-sm mt-1">{errors.postalCode}</span>}
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-control mt-6">
              <button 
                type="submit" 
                className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
          
          <div className="divider">OU</div>
          
          <p className="text-center">
            Já tem uma conta? <Link to="/login" className="link link-primary">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage