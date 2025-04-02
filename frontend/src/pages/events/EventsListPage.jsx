import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/events', {
          params: { type: filter !== 'all' ? filter : undefined }
        });
        setEvents(response.data.events || []);
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [filter]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Formatar data
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8 text-center">Eventos e Campanhas</h1>
      
      {/* Filtros */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            value="all"
            onClick={handleFilterChange}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            value="adoption"
            onClick={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'adoption' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Adoção
          </button>
          <button
            type="button"
            value="fundraising"
            onClick={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'fundraising' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Arrecadação
          </button>
          <button
            type="button"
            value="educational"
            onClick={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              filter === 'educational' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Educacional
          </button>
        </div>
      </div>
      
      {/* Lista de eventos */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image || '/images/event-placeholder.jpg'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-primary-500 text-white px-2 py-1 text-sm">
                  {{
                    adoption: 'Adoção',
                    fundraising: 'Arrecadação',
                    educational: 'Educacional',
                    other: 'Outro'
                  }[event.eventType] || 'Evento'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.date)}
                  </div>
                  <div className="text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                </div>
                <Link
                  to={`/events/${event.id}`}
                  className="custom-btn-primary inline-block w-full text-center"
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700">Nenhum evento encontrado</h3>
          <p className="mt-2 text-gray-500">Não há eventos disponíveis no momento para o filtro selecionado.</p>
        </div>
      )}
    </div>
  );
};

export default EventsListPage; 