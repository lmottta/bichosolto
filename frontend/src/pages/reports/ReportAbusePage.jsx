import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const ReportAbusePage = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    animalType: '',
    urgencyLevel: 'medium',
    images: []
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState([])
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  
  // Tipos de animais para o select
  const animalTypes = [
    'Cachorro',
    'Gato',
    'Ave',
    'Cavalo',
    'Outros mamíferos',
    'Réptil',
    'Outro'
  ]
  
  // Níveis de urgência
  const urgencyLevels = [
    { value: 'low', label: 'Baixa - Situação preocupante, mas não imediata' },
    { value: 'medium', label: 'Média - Requer atenção em breve' },
    { value: 'high', label: 'Alta - Situação crítica, atenção urgente' },
    { value: 'critical', label: 'Crítica - Risco de vida, emergência' }
  ]

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length > 5) {
      toast.error('Você pode enviar no máximo 5 imagens')
      return
    }
    
    // Verificar tamanho e tipo de arquivo
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isValidType) {
        toast.error(`${file.name} não é um tipo de imagem válido. Use JPEG ou PNG.`)
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} excede o tamanho máximo de 5MB.`)
      }
      
      return isValidType && isValidSize
    })
    
    setFormData({
      ...formData,
      images: validFiles
    })
    
    // Criar URLs para preview das imagens
    const imageUrls = validFiles.map(file => URL.createObjectURL(file))
    setPreviewImages(imageUrls)
  }

  // Converter coordenadas para endereço usando Geocoding
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      // Usando a API gratuita Nominatim do OpenStreetMap
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          format: 'json',
          lat: latitude,
          lon: longitude,
          addressdetails: 1
        },
        headers: {
          'Accept-Language': 'pt-BR'
        }
      });
      
      if (response.data && response.data.display_name) {
        return response.data.display_name;
      } else {
        throw new Error('Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      throw error;
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      setUseCurrentLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Armazenar as coordenadas temporariamente
            const coordsString = `${latitude}, ${longitude}`;
            
            // Tentar obter o endereço a partir das coordenadas
            try {
              const address = await getAddressFromCoordinates(latitude, longitude);
              
              setFormData({
                ...formData,
                location: address
              });
              
              toast.success('Endereço encontrado com sucesso!');
            } catch (error) {
              // Se não conseguir obter o endereço, usar as coordenadas
              setFormData({
                ...formData,
                location: coordsString
              });
              
              toast.warning('Não foi possível obter o endereço completo. Coordenadas salvas.');
            }
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          let errorMessage = 'Não foi possível obter sua localização. Por favor, digite manualmente.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Acesso à localização negado. Por favor, habilite a permissão de localização no seu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informações de localização indisponíveis. Tente novamente ou digite manualmente.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado ao obter localização. Tente novamente ou digite manualmente.';
              break;
          }
          
          toast.error(errorMessage);
          setUseCurrentLocation(false);
          setIsLoadingLocation(false);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast.error('Geolocalização não é suportada pelo seu navegador. Por favor, digite manualmente.');
    }
  };

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Localização é obrigatória'
    }
    
    if (!formData.animalType) {
      newErrors.animalType = 'Tipo de animal é obrigatório'
    }
    
    if (formData.images.length === 0) {
      newErrors.images = 'Pelo menos uma imagem é obrigatória'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.info('Você precisa estar logado para enviar uma denúncia')
      navigate('/login', { state: { from: '/report-abuse' } })
      return
    }
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Criar FormData para envio de arquivos
      const reportFormData = new FormData()
      reportFormData.append('title', formData.title)
      reportFormData.append('description', formData.description)
      reportFormData.append('location', formData.location)
      reportFormData.append('animalType', formData.animalType)
      reportFormData.append('urgencyLevel', formData.urgencyLevel)
      reportFormData.append('userId', user.id)
      
      // Adicionar imagens
      formData.images.forEach((image, index) => {
        reportFormData.append('images', image)
      })
      
      // Enviar para a API
      const response = await axios.post('/api/reports', reportFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      toast.success('Denúncia enviada com sucesso! Obrigado por ajudar os animais.')
      navigate('/my-reports')
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error)
      
      // Extrair mensagem de erro específica da API
      let errorMessage = 'Erro ao enviar denúncia. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erro de validação da API
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else if (error.response.data.message) {
          // Mensagem de erro genérica da API
          errorMessage = error.response.data.message;
        } else if (error.response.status === 413) {
          errorMessage = "As imagens anexadas são muito grandes. O tamanho máximo é 5MB por imagem.";
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        // O pedido foi feito mas não houve resposta do servidor
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Denunciar Maus-Tratos</h1>
        <p className="text-lg mb-6">Ajude a proteger os animais reportando situações de maus-tratos ou abandono.</p>
        
        {!isAuthenticated && (
          <div className="alert alert-warning mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">Atenção!</h3>
              <div className="text-sm">Você precisa estar logado para enviar uma denúncia. <Link to="/login" className="font-bold">Clique aqui para entrar</Link>.</div>
            </div>
          </div>
        )}
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Título da denúncia*</span>
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Cachorro abandonado na Rua das Flores" 
                  className={`input input-bordered ${errors.title ? 'input-error' : ''}`} 
                />
                {errors.title && <span className="text-error text-sm mt-1">{errors.title}</span>}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Descrição detalhada*</span>
                </label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva a situação com o máximo de detalhes possível. Inclua informações sobre o estado do animal, há quanto tempo está na situação, comportamento, etc." 
                  className={`textarea textarea-bordered h-32 ${errors.description ? 'textarea-error' : ''}`} 
                />
                {errors.description && <span className="text-error text-sm mt-1">{errors.description}</span>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Localização*</span>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Endereço ou coordenadas" 
                      className={`input input-bordered flex-grow ${errors.location ? 'input-error' : ''}`} 
                      disabled={isLoadingLocation}
                    />
                    <button 
                      type="button" 
                      className={`btn ${isLoadingLocation ? 'btn-disabled loading' : 'btn-secondary'}`}
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                    >
                      {isLoadingLocation ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.location && <span className="text-error text-sm mt-1">{errors.location}</span>}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tipo de animal*</span>
                  </label>
                  <select 
                    name="animalType"
                    value={formData.animalType}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors.animalType ? 'select-error' : ''}`}
                  >
                    <option value="" disabled>Selecione o tipo de animal</option>
                    {animalTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.animalType && <span className="text-error text-sm mt-1">{errors.animalType}</span>}
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nível de urgência</span>
                </label>
                <select 
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  {urgencyLevels.map((level, index) => (
                    <option key={index} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Imagens*</span>
                  <span className="label-text-alt">Máximo 5 imagens (JPEG, PNG, máx. 5MB cada)</span>
                </label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/jpg"
                  multiple
                  onChange={handleImageChange}
                  className={`file-input file-input-bordered w-full ${errors.images ? 'file-input-error' : ''}`} 
                />
                {errors.images && <span className="text-error text-sm mt-1">{errors.images}</span>}
                
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                    {previewImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting || !isAuthenticated}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 bg-base-200 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Importante:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Forneça informações precisas e detalhadas para facilitar o resgate.</li>
                <li>Em casos de extrema urgência, além de registrar aqui, entre em contato com as autoridades locais.</li>
                <li>Sua identidade será mantida em sigilo se desejar.</li>
                <li>Denúncias falsas são crime e podem ser rastreadas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportAbusePage