import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const eventsPerPage = 10;

  useEffect(() => {
    fetchEvents();
  }, [filter, currentPage]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/events', {
        params: {
          type: filter.type !== 'all' ? filter.type : undefined,
          status: filter.status !== 'all' ? filter.status : undefined,
          search: filter.search || undefined,
          page: currentPage,
          limit: eventsPerPage
        }
      });
      
      setEvents(response.data.events || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Não foi possível carregar os eventos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setFilter(prev => ({
      ...prev,
      search: e.target.value
    }));
    setCurrentPage(1);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`/api/admin/events/${eventToDelete.id}`);
      
      // Remover o evento da lista
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== eventToDelete.id)
      );
      
      toast.success('Evento removido com sucesso');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Não foi possível excluir o evento');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilter({
      type: 'all',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
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

  // Verificar se o evento é passado, presente ou futuro
  const getEventTimeStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    
    // Considerando um evento como "acontecendo agora" se estiver no mesmo dia
    const isToday = eventDate.toDateString() === now.toDateString();
    
    if (isToday) return 'current';
    return eventDate < now ? 'past' : 'future';
  };

  // Traduzir tipo de evento
  const translateEventType = (type) => {
    const types = {
      'adoption': 'Adoção',
      'fundraising': 'Arrecadação',
      'educational': 'Educacional',
      'other': 'Outro'
    };
    
    return types[type] || type;
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Eventos</h1>
        <Link to="/admin/events/new" className="custom-btn-primary">
          Criar Novo Evento
        </Link>
      </div>
      
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              name="search"
              placeholder="Título, descrição, local..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter.search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              name="type"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter.type}
              onChange={handleFilterChange}
            >
              <option value="all">Todos</option>
              <option value="adoption">Adoção</option>
              <option value="fundraising">Arrecadação</option>
              <option value="educational">Educacional</option>
              <option value="other">Outro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="all">Todos</option>
              <option value="upcoming">Próximos</option>
              <option value="past">Concluídos</option>
              <option value="today">Hoje</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de eventos */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={event.image || '/images/event-placeholder.jpg'}
                              alt={event.title}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-500">#{event.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {translateEventType(event.eventType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                        {getEventTimeStatus(event.date) === 'past' ? (
                          <span className="text-xs text-gray-500">Evento concluído</span>
                        ) : getEventTimeStatus(event.date) === 'current' ? (
                          <span className="text-xs text-green-500 font-semibold">Hoje</span>
                        ) : (
                          <span className="text-xs text-blue-500">Próximo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/events/${event.id}/edit`} 
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(event)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md mr-2 border border-gray-300 disabled:opacity-50"
                >
                  Anterior
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? 'bg-primary-500 text-white'
                          : 'border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md ml-2 border border-gray-300 disabled:opacity-50"
                >
                  Próxima
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-500 mb-6">
            {filter.search || filter.type !== 'all' || filter.status !== 'all'
              ? 'Nenhum evento corresponde aos critérios de busca.'
              : 'Não há eventos cadastrados no sistema.'}
          </p>
          <Link to="/admin/events/new" className="custom-btn-primary">
            Criar Novo Evento
          </Link>
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir o evento <span className="font-semibold">{eventToDelete?.title}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage; 