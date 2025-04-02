import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const UserVolunteeringPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [volunteerProfile, setVolunteerProfile] = useState(null)
  const [volunteerEvents, setVolunteerEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  // Buscar perfil de voluntário e eventos
  useEffect(() => {
    const fetchVolunteerData = async () => {
      try {
        setIsLoading(true)
        
        // Buscar perfil de voluntário
        const profileResponse = await axios.get('/api/volunteers/user/me')
        setVolunteerProfile(profileResponse.data)
        
        // Buscar eventos em que o voluntário está inscrito
        if (profileResponse.data.events) {
          setVolunteerEvents(profileResponse.data.events)
        }
        
        // Buscar próximos eventos disponíveis
        const eventsResponse = await axios.get('/api/events', {
          params: { 
            isActive: true,
            startDate: new Date().toISOString()
          }
        })
        setUpcomingEvents(eventsResponse.data.events)
        
      } catch (error) {
        console.error('Erro ao buscar dados de voluntário:', error)
        if (error.response?.status === 404) {
          toast.info('Você ainda não está cadastrado como voluntário')
        } else {
          toast.error('Erro ao carregar dados. Tente novamente.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchVolunteerData()
  }, [])

  // Cancelar participação em um evento
  const handleCancelParticipation = async (eventId) => {
    try {
      setIsLoading(true)
      
      await axios.delete(`/api/events/${eventId}/volunteers`)
      
      toast.success('Participação cancelada com sucesso')
      
      // Atualizar a lista de eventos
      setVolunteerEvents(prev => prev.filter(event => event.id !== eventId))
      
    } catch (error) {
      console.error('Erro ao cancelar participação:', error)
      toast.error(error.response?.data?.message || 'Erro ao cancelar participação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Inscrever-se em um novo evento
  const handleJoinEvent = async (eventId) => {
    try {
      setIsLoading(true)
      
      const response = await axios.post(`/api/events/${eventId}/volunteers`)
      
      toast.success(response.data.message)
      
      // Atualizar a lista de eventos
      const eventToAdd = upcomingEvents.find(event => event.id === eventId)
      if (eventToAdd) {
        setVolunteerEvents(prev => [...prev, eventToAdd])
      }
      
    } catch (error) {
      console.error('Erro ao participar do evento:', error)
      toast.error(error.response?.data?.message || 'Erro ao participar do evento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar status de voluntário
  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsLoading(true)
      
      await axios.patch(`/api/volunteers/${volunteerProfile.id}/status`, {
        status: newStatus
      })
      
      toast.success('Status atualizado com sucesso')
      
      // Atualizar o perfil
      setVolunteerProfile(prev => ({ ...prev, status: newStatus }))
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.response?.data?.message || 'Erro ao atualizar status. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Minhas Atividades de Voluntariado</h1>
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!volunteerProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Minhas Atividades de Voluntariado</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Você ainda não é um voluntário</h2>
          <p className="text-gray-600 mb-6">Cadastre-se como voluntário para ajudar animais necessitados e participar de eventos especiais.</p>
          
          <Link 
            to="/volunteer" 
            className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
          >
            Tornar-se Voluntário
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Minhas Atividades de Voluntariado</h1>
      
      {/* Perfil de voluntário */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Meu Perfil de Voluntário</h2>
          
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              volunteerProfile.status === 'active' ? 'bg-green-100 text-green-800' :
              volunteerProfile.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              volunteerProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {{
                'pending': 'Pendente',
                'approved': 'Aprovado',
                'active': 'Ativo',
                'inactive': 'Inativo'
              }[volunteerProfile.status]}
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Disponibilidade</h3>
            <p className="text-gray-800">{{
              'weekdays': 'Dias de semana',
              'weekends': 'Finais de semana',
              'evenings': 'Noites',
              'full_time': 'Tempo integral',
              'on_call': 'Sob demanda'
            }[volunteerProfile.availability]}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Horas disponíveis por semana</h3>
            <p className="text-gray-800">{volunteerProfile.availableHours || 'Não informado'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Data de início</h3>
            <p className="text-gray-800">
              {volunteerProfile.startDate ? new Date(volunteerProfile.startDate).toLocaleDateString() : 'Ainda não iniciado'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Possui veículo</h3>
            <p className="text-gray-800">{volunteerProfile.hasVehicle ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Habilidades</h3>
          {volunteerProfile.skills && volunteerProfile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {volunteerProfile.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhuma habilidade informada</p>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Atividades Preferidas</h3>
          {volunteerProfile.preferredActivities && volunteerProfile.preferredActivities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {volunteerProfile.preferredActivities.map((activity, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
                  {activity}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhuma atividade preferida informada</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link 
            to="/volunteer" 
            className="bg-primary text-white py-1.5 px-4 rounded-md hover:bg-primary-dark transition-colors text-sm"
          >
            Atualizar Perfil
          </Link>
          
          {volunteerProfile.status === 'inactive' && (
            <button
              onClick={() => handleUpdateStatus('active')}
              className="bg-green-600 text-white py-1.5 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Reativar Cadastro
            </button>
          )}
          
          {volunteerProfile.status === 'active' && (
            <button
              onClick={() => handleUpdateStatus('inactive')}
              className="bg-gray-600 text-white py-1.5 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Pausar Atividades
            </button>
          )}
        </div>
      </div>
      
      {/* Eventos em que estou inscrito */}
      <h2 className="text-2xl font-semibold mb-4">Meus Eventos</h2>
      
      {volunteerEvents.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {volunteerEvents.map(event => {
            const eventDate = new Date(event.startDate)
            const isPast = eventDate < new Date()
            
            return (
              <div key={event.id} className={`bg-white rounded-lg shadow-md overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
                {event.image && (
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    
                    {isPast ? (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Concluído</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Ativo</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{eventDate.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  
                  <Link 
                    to={`/events/${event.id}`}
                    className="text-primary hover:text-primary-dark font-medium text-sm inline-block mb-3"
                  >
                    Ver detalhes
                  </Link>
                  
                  {!isPast && (
                    <button
                      onClick={() => handleCancelParticipation(event.id)}
                      className="w-full mt-2 bg-red-100 text-red-700 py-1.5 px-3 rounded-md hover:bg-red-200 transition-colors text-sm"
                    >
                      Cancelar Participação
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center mb-8">
          <p className="text-gray-600">Você ainda não está inscrito em nenhum evento.</p>
          <p className="text-gray-600 mt-2">Confira os eventos disponíveis abaixo e participe!</p>
        </div>
      )}
      
      {/* Próximos eventos disponíveis */}
      <h2 className="text-2xl font-semibold mb-4">Eventos Disponíveis</h2>
      
      {upcomingEvents.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents
            .filter(event => !volunteerEvents.some(myEvent => myEvent.id === event.id))
            .map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {event.image && (
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-48 object-cover"
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
                    <Link 
                      to={`/events/${event.id}`}
                      className="text-primary hover:text-primary-dark font-medium text-sm"
                    >
                      Ver detalhes
                    </Link>
                    
                    <button
                      onClick={() => handleJoinEvent(event.id)}
                      className="bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary-dark transition-colors text-sm"
                      disabled={isLoading}
                    >
                      Participar
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">Não há eventos disponíveis no momento.</p>
          <p className="text-gray-600 mt-2">Volte mais tarde para verificar novos eventos.</p>
        </div>
      )}
    </div>
  )
}

export default UserVolunteeringPage