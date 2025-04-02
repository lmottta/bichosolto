import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    availability: 'any',
    message: '',
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/events/${id}`);
        setEvent(response.data);
        
        // Preencher formulário com dados do usuário se estiver autenticado
        if (isAuthenticated && user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do evento:', error);
        toast.error('Não foi possível carregar os detalhes do evento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitVolunteer = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await axios.post(`/api/events/${id}/volunteer`, formData);
      
      toast.success('Inscrição como voluntário enviada com sucesso!');
      setShowVolunteerModal(false);
    } catch (error) {
      console.error('Erro ao enviar inscrição de voluntário:', error);
      toast.error(error.response?.data?.message || 'Erro ao processar inscrição');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Verificar se o evento já passou
  const isEventPast = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate < now;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Evento não encontrado</h2>
        <p className="mt-2 text-gray-500">O evento que você está procurando não existe ou foi removido.</p>
        <Link to="/events" className="custom-btn-primary inline-block mt-6">
          Voltar para lista de eventos
        </Link>
      </div>
    );
  }

  const isPastEvent = isEventPast(event.date);

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex">
          <Link to="/" className="text-gray-500 hover:text-primary-500">Início</Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link to="/events" className="text-gray-500 hover:text-primary-500">Eventos</Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">{event.title}</span>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cabeçalho do evento */}
        <div className="relative h-64 lg:h-80">
          <img 
            src={event.image || '/images/event-placeholder.jpg'} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
            <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-3 w-fit">
              {{
                adoption: 'Adoção',
                fundraising: 'Arrecadação',
                educational: 'Educacional',
                other: 'Outro'
              }[event.eventType] || 'Evento'}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.date)}
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
              {isPastEvent && (
                <div className="flex items-center bg-red-500 px-2 py-1 rounded-full text-xs font-medium">
                  Evento finalizado
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Conteúdo do evento */}
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Sobre o Evento</h2>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
          </div>
          
          {event.needsVolunteers && !isPastEvent && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Voluntariado</h2>
              <p className="text-gray-700 mb-4">
                Este evento precisa de voluntários! Inscreva-se para ajudar na organização e realização deste evento.
              </p>
              <button
                onClick={() => setShowVolunteerModal(true)}
                className="custom-btn-primary"
              >
                Quero ser voluntário
              </button>
            </div>
          )}
          
          {event.eventType === 'fundraising' && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Campanha de Arrecadação</h2>
              <p className="text-gray-700 mb-4">
                {event.fundraisingDetails || 'Ajude a nossa causa doando qualquer valor. Cada contribuição faz diferença!'}
              </p>
              <Link to="/donate" className="custom-btn-primary inline-block">
                Quero Contribuir
              </Link>
            </div>
          )}
          
          {event.organizer && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-lg mb-2">Organizado por:</h3>
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center mr-3 overflow-hidden">
                  {event.organizer.profileImage ? (
                    <img 
                      src={event.organizer.profileImageUrl || event.organizer.profileImage} 
                      alt={event.organizer.name} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        // Tentar URL alternativa se a principal falhar
                        if (event.organizer.profileImage) {
                          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                          if (!event.organizer.profileImage.startsWith('http')) {
                            e.target.src = `${apiBaseUrl}${event.organizer.profileImage}`;
                          }
                        } else {
                          // Fallback para iniciais em caso de erro
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<span class="text-lg font-bold text-gray-700">${event.organizer.name.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-700">
                      {event.organizer.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{event.organizer.name}</p>
                  <p className="text-sm text-gray-500">{event.organizer.role === 'ong' ? 'ONG' : 'Organizador'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de voluntariado */}
      {showVolunteerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Inscrição para Voluntariado</h2>
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitVolunteer}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nome Completo *</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Telefone *</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Disponibilidade</span>
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="select select-bordered w-full"
                    >
                      <option value="any">Qualquer horário</option>
                      <option value="morning">Manhã</option>
                      <option value="afternoon">Tarde</option>
                      <option value="evening">Noite</option>
                      <option value="weekend">Fins de semana</option>
                    </select>
                  </div>
                  
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Experiência prévia</span>
                    </label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full h-20"
                      placeholder="Descreva brevemente sua experiência com voluntariado ou na área do evento (se houver)"
                    ></textarea>
                  </div>
                  
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Por que você deseja ser voluntário neste evento?</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full h-20"
                      placeholder="Conte-nos sua motivação para participar..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowVolunteerModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="custom-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Inscrição'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage; 