import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const VolunteerPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isVolunteer, setIsVolunteer] = useState(false)
  const [volunteerProfile, setVolunteerProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [eventsPage, setEventsPage] = useState(1)
  const [hasMoreEvents, setHasMoreEvents] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [formData, setFormData] = useState({
    availability: 'weekends',
    skills: [],
    availableHours: 4,
    experience: '',
    hasVehicle: false,
    preferredActivities: [],
    emergencyContactName: '',
    emergencyContactPhone: ''
  })

  // Opções para os campos de seleção - memoizadas para evitar recriação
  const availabilityOptions = useMemo(() => [
    { value: 'weekends', label: 'Finais de semana' },
    { value: 'weekdays', label: 'Dias de semana' },
    { value: 'evenings', label: 'Noites' },
    { value: 'full_time', label: 'Tempo integral' },
    { value: 'on_call', label: 'Sob demanda' }
  ], [])

  const skillOptions = useMemo(() => [
    'Cuidados com animais',
    'Veterinária',
    'Transporte',
    'Fotografia',
    'Marketing',
    'Redes sociais',
    'Organização de eventos',
    'Captação de recursos',
    'Administrativo',
    'Educação',
    'Treinamento de animais',
    'Construção/Manutenção'
  ], [])

  const activityOptions = useMemo(() => [
    'Resgate de animais',
    'Cuidados diários',
    'Passeios com cães',
    'Transporte para veterinário',
    'Organização de eventos',
    'Campanhas de adoção',
    'Divulgação nas redes sociais',
    'Captação de recursos',
    'Educação e conscientização',
    'Limpeza e manutenção',
    'Apoio administrativo'
  ], [])

  // Verificar se o usuário já é um voluntário - usando useCallback para memoizar a função
  const checkVolunteerStatus = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      const response = await axios.get('/api/volunteers/user/me')
      setIsVolunteer(true)
      setVolunteerProfile(response.data)
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Erro ao verificar status de voluntário:', error)
      }
      setIsVolunteer(false)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Buscar eventos disponíveis para voluntários - com paginação
  const fetchEvents = useCallback(async (page = 1, append = false) => {
    if (isLoadingEvents || (!hasMoreEvents && page > 1)) return
    
    try {
      setIsLoadingEvents(true)
      const limit = 6 // Número de eventos por página
      
      const response = await axios.get('/api/events', {
        params: { 
          isActive: true,
          page,
          limit
        }
      })
      
      const newEvents = response.data.events || []
      
      // Verificar se há mais eventos para carregar
      setHasMoreEvents(newEvents.length === limit)
      
      // Atualizar a lista de eventos (append ou substituir)
      if (append) {
        setEvents(prev => [...prev, ...newEvents])
      } else {
        setEvents(newEvents)
      }
      
      setEventsPage(page)
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      toast.error('Não foi possível carregar os eventos. Tente novamente mais tarde.')
    } finally {
      setIsLoadingEvents(false)
    }
  }, [isLoadingEvents, hasMoreEvents])

  // Carregar mais eventos
  const loadMoreEvents = useCallback(() => {
    if (!isLoadingEvents && hasMoreEvents) {
      fetchEvents(eventsPage + 1, true)
    }
  }, [fetchEvents, eventsPage, isLoadingEvents, hasMoreEvents])

  // Efeito para verificar status de voluntário
  useEffect(() => {
    checkVolunteerStatus()
  }, [checkVolunteerStatus])

  // Efeito para buscar eventos iniciais
  useEffect(() => {
    fetchEvents(1, false)
  }, [fetchEvents])

  // Manipular mudanças nos campos do formulário
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }, [])

  // Manipular mudanças em campos de múltipla seleção
  const handleMultiSelectChange = useCallback((e, fieldName) => {
    const value = e.target.value
    
    setFormData(prev => {
      const currentValues = [...prev[fieldName]]
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [fieldName]: currentValues.filter(item => item !== value)
        }
      } else {
        return {
          ...prev,
          [fieldName]: [...currentValues, value]
        }
      }
    })
  }, [])

  // Enviar formulário de cadastro de voluntário
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.info('Faça login para se cadastrar como voluntário')
      navigate('/login', { state: { from: '/volunteer' } })
      return
    }
    
    try {
      setIsLoading(true)
      
      // Formatar os dados adequadamente antes de enviar
      const formattedData = {
        ...formData,
        // Garantir que os arrays estejam sendo enviados corretamente
        skills: Array.isArray(formData.skills) ? formData.skills : [],
        preferredActivities: Array.isArray(formData.preferredActivities) ? formData.preferredActivities : []
      }
      
      const response = await axios.post('/api/volunteers', formattedData)
      
      toast.success(response.data.message)
      setIsVolunteer(true)
      setVolunteerProfile(response.data.volunteer)
      
    } catch (error) {
      console.error('Erro ao cadastrar voluntário:', error)
      
      // Extrair mensagem de erro específica da API
      let errorMessage = 'Erro ao cadastrar voluntário. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erro de validação da API
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else if (error.response.data.message) {
          // Mensagem de erro genérica da API
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        // O pedido foi feito mas não houve resposta do servidor
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [formData, isAuthenticated, navigate])

  // Inscrever-se em um evento como voluntário
  const handleJoinEvent = useCallback(async (eventId) => {
    if (!isAuthenticated) {
      toast.info('Faça login para participar deste evento')
      navigate('/login', { state: { from: '/volunteer' } })
      return
    }
    
    if (!isVolunteer) {
      toast.info('Você precisa se cadastrar como voluntário primeiro')
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await axios.post(`/api/events/${eventId}/volunteers`)
      
      toast.success(response.data.message)
      
      // Atualizar o perfil do voluntário para mostrar o novo evento
      const updatedProfile = await axios.get('/api/volunteers/user/me')
      setVolunteerProfile(updatedProfile.data)
      
    } catch (error) {
      console.error('Erro ao participar do evento:', error)
      
      // Extrair mensagem de erro específica da API
      let errorMessage = 'Erro ao participar do evento. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 409) {
          errorMessage = "Você já está inscrito neste evento como voluntário.";
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, isVolunteer, navigate])

  // Renderização condicional do status do voluntário
  const renderVolunteerStatus = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    if (isVolunteer && volunteerProfile) {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Seu Perfil de Voluntário</h2>
          
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-800 font-medium">Status: {{
              'pending': 'Pendente de aprovação',
              'approved': 'Aprovado',
              'active': 'Ativo',
              'inactive': 'Inativo'
            }[volunteerProfile.status]}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium text-gray-700">Disponibilidade</h3>
              <p>{availabilityOptions.find(opt => opt.value === volunteerProfile.availability)?.label}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Horas disponíveis por semana</h3>
              <p>{volunteerProfile.availableHours || 'Não informado'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Possui veículo</h3>
              <p>{volunteerProfile.hasVehicle ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-1">Habilidades</h3>
            {volunteerProfile.skills && volunteerProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {volunteerProfile.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma habilidade informada</p>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-1">Atividades Preferidas</h3>
            {volunteerProfile.preferredActivities && volunteerProfile.preferredActivities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {volunteerProfile.preferredActivities.map((activity, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
                    {activity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma atividade preferida informada</p>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700">Experiência</h3>
            <p className="text-gray-600">{volunteerProfile.experience || 'Nenhuma experiência informada'}</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/my-volunteering')}
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
            >
              Ver Minhas Atividades
            </button>
          </div>
        </div>
      )
    }
    
    if (!isVolunteer) {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cadastre-se como Voluntário</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="availability">
                Disponibilidade *
              </label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Habilidades (selecione todas que se aplicam)
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {skillOptions.map((skill, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={skill}
                      checked={formData.skills.includes(skill)}
                      onChange={(e) => handleMultiSelectChange(e, 'skills')}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="availableHours">
                Horas disponíveis por semana
              </label>
              <input
                type="number"
                id="availableHours"
                name="availableHours"
                value={formData.availableHours}
                onChange={handleChange}
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="experience">
                Experiência prévia (opcional)
              </label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="hasVehicle"
                  checked={formData.hasVehicle}
                  onChange={handleChange}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Possuo veículo próprio</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Atividades de interesse (selecione todas que se aplicam)
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {activityOptions.map((activity, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={activity}
                      checked={formData.preferredActivities.includes(activity)}
                      onChange={(e) => handleMultiSelectChange(e, 'preferredActivities')}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>{activity}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="emergencyContactName">
                  Nome do contato de emergência
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="emergencyContactPhone">
                  Telefone do contato de emergência
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Cadastrar como Voluntário'}
              </button>
            </div>
          </form>
        </div>
      )
    }
    
    return null
  }, [isLoading, isVolunteer, volunteerProfile, formData, availabilityOptions, skillOptions, activityOptions, handleChange, handleMultiSelectChange, handleSubmit, navigate])

  // Renderização dos eventos
  const renderEvents = useMemo(() => {
    if (events.length === 0 && !isLoadingEvents) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nenhum evento disponível no momento.</p>
        </div>
      )
    }
    
    return (
      <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-48 object-cover"
                  loading="lazy" // Carregamento lazy para imagens
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+não+disponível';
                  }}
                />
              )}
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{event.location}</span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {event.maxParticipants ? 
                      `${event.currentParticipants || 0}/${event.maxParticipants} voluntários` : 
                      'Voluntários ilimitados'}
                  </span>
                  
                  <button
                    onClick={() => handleJoinEvent(event.id)}
                    className="bg-primary text-white py-1 px-3 rounded-md hover:bg-primary-dark transition-colors text-sm"
                    disabled={isLoading}
                  >
                    Participar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {hasMoreEvents && (
          <div className="mt-6 text-center">
            <button 
              onClick={loadMoreEvents}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
              disabled={isLoadingEvents}
            >
              {isLoadingEvents ? 'Carregando...' : 'Carregar mais eventos'}
            </button>
          </div>
        )}
      </>
    )
  }, [events, isLoadingEvents, hasMoreEvents, loadMoreEvents, handleJoinEvent, isLoading])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Seja um Voluntário</h1>
      
      {renderVolunteerStatus}
      
      {/* Eventos disponíveis para voluntários */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-center mb-6">Eventos que Precisam de Voluntários</h2>
        
        {isLoadingEvents && events.length === 0 ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : renderEvents}
      </div>
      
      <div className="mt-8 max-w-2xl mx-auto bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Por que ser voluntário?</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ajude a salvar e melhorar a vida de animais necessitados</li>
          <li>Desenvolva novas habilidades e ganhe experiência</li>
          <li>Conheça pessoas que compartilham dos mesmos valores</li>
          <li>Faça a diferença na sua comunidade</li>
          <li>Participe de eventos e campanhas especiais</li>
        </ul>
      </div>
    </div>
  )
}

export default VolunteerPage