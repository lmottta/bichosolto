import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminVolunteersPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('volunteers');
  const [filter, setFilter] = useState({
    availability: 'all',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (activeTab === 'volunteers') {
      fetchVolunteers();
    } else {
      fetchApplications();
    }
  }, [activeTab, filter, currentPage]);

  const fetchVolunteers = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/volunteers', {
        params: {
          availability: filter.availability !== 'all' ? filter.availability : undefined,
          status: filter.status !== 'all' ? filter.status : undefined,
          search: filter.search || undefined,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      setVolunteers(response.data.volunteers || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar voluntários:', error);
      toast.error('Não foi possível carregar os voluntários');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/volunteer-applications', {
        params: {
          status: filter.status !== 'all' ? filter.status : undefined,
          search: filter.search || undefined,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      setApplications(response.data.applications || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
      toast.error('Não foi possível carregar as inscrições');
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

  const viewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const resetFilters = () => {
    setFilter({
      availability: 'all',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setIsProcessing(true);
      
      if (activeTab === 'volunteers') {
        await axios.put(`/api/admin/volunteers/${id}/status`, { status: newStatus });
        
        // Atualizar o voluntário na lista
        setVolunteers(prevVolunteers => 
          prevVolunteers.map(vol => 
            vol.id === id 
              ? { ...vol, status: newStatus } 
              : vol
          )
        );
      } else {
        await axios.put(`/api/admin/volunteer-applications/${id}/status`, { status: newStatus });
        
        // Atualizar a inscrição na lista
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app.id === id 
              ? { ...app, status: newStatus } 
              : app
          )
        );
      }
      
      // Atualizar o item selecionado se estiver aberto
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(prev => ({ ...prev, status: newStatus }));
      }
      
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar o status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statuses = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado'
    };
    
    return statuses[status] || status;
  };

  // Traduzir disponibilidade
  const translateAvailability = (availability) => {
    const options = {
      'any': 'Qualquer horário',
      'morning': 'Manhã',
      'afternoon': 'Tarde',
      'evening': 'Noite',
      'weekend': 'Fins de semana'
    };
    
    return options[availability] || availability;
  };

  // Retorna a classe CSS apropriada para o status
  const getStatusClass = (status) => {
    const classes = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return `${classes[status] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium`;
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Voluntários</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('volunteers');
              resetFilters();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'volunteers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Voluntários
          </button>
          <button
            onClick={() => {
              setActiveTab('applications');
              resetFilters();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inscrições
          </button>
        </nav>
      </div>
      
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              name="search"
              placeholder="Nome, email, telefone..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter.search}
              onChange={handleSearchChange}
            />
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
              {activeTab === 'volunteers' ? (
                <>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </>
              ) : (
                <>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </>
              )}
            </select>
          </div>
          
          {activeTab === 'volunteers' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidade</label>
              <select
                name="availability"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={filter.availability}
                onChange={handleFilterChange}
              >
                <option value="all">Todas</option>
                <option value="any">Qualquer horário</option>
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noite</option>
                <option value="weekend">Fins de semana</option>
              </select>
            </div>
          )}
          
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
      
      {/* Lista de voluntários ou inscrições */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : activeTab === 'volunteers' ? (
        // Lista de voluntários
        volunteers.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Disponibilidade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desde
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {volunteers.map((volunteer) => (
                      <tr key={volunteer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-semibold">
                                  {volunteer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                              <div className="text-sm text-gray-500">#{volunteer.id.substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{volunteer.email}</div>
                          <div className="text-sm text-gray-500">{volunteer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {translateAvailability(volunteer.availability)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(volunteer.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusClass(volunteer.status)}>
                            {translateStatus(volunteer.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDetails(volunteer)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalhes
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum voluntário encontrado</h3>
            <p className="text-gray-500">
              {filter.search || filter.status !== 'all' || filter.availability !== 'all'
                ? 'Nenhum voluntário corresponde aos critérios de busca.'
                : 'Não há voluntários cadastrados no sistema.'}
            </p>
          </div>
        )
      ) : (
        // Lista de inscrições
        applications.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evento/Programa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">#{application.id.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{application.email}</div>
                          <div className="text-sm text-gray-500">{application.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{application.eventTitle || application.programName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusClass(application.status)}>
                            {translateStatus(application.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDetails(application)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalhes
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma inscrição encontrada</h3>
            <p className="text-gray-500">
              {filter.search || filter.status !== 'all'
                ? 'Nenhuma inscrição corresponde aos critérios de busca.'
                : 'Não há inscrições pendentes no sistema.'}
            </p>
          </div>
        )
      )}
      
      {/* Modal de detalhes */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'volunteers' ? 'Detalhes do Voluntário' : 'Detalhes da Inscrição'}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Nome</h4>
                  <p className="text-gray-900">{selectedItem.name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={getStatusClass(selectedItem.status)}>
                    {translateStatus(selectedItem.status)}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p className="text-gray-900">{selectedItem.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Telefone</h4>
                  <p className="text-gray-900">{selectedItem.phone || 'Não informado'}</p>
                </div>
                
                {selectedItem.address && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Endereço</h4>
                    <p className="text-gray-900">{selectedItem.address}</p>
                    {selectedItem.city && selectedItem.state && (
                      <p className="text-gray-900">{selectedItem.city}, {selectedItem.state}</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'volunteers' && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Disponibilidade</h4>
                      <p className="text-gray-900">{translateAvailability(selectedItem.availability)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Voluntário desde</h4>
                      <p className="text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                  </>
                )}
                
                {activeTab === 'applications' && (
                  <>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        {selectedItem.eventTitle ? 'Evento' : 'Programa'}
                      </h4>
                      <p className="text-gray-900">{selectedItem.eventTitle || selectedItem.programName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Data da Inscrição</h4>
                      <p className="text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Disponibilidade</h4>
                      <p className="text-gray-900">{translateAvailability(selectedItem.availability)}</p>
                    </div>
                  </>
                )}
                
                {selectedItem.experience && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Experiência</h4>
                    <p className="text-gray-900 whitespace-pre-line">{selectedItem.experience}</p>
                  </div>
                )}
                
                {selectedItem.message && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Mensagem</h4>
                    <p className="text-gray-900 whitespace-pre-line">{selectedItem.message}</p>
                  </div>
                )}
                
                {selectedItem.notes && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Notas Internas</h4>
                    <p className="text-gray-900 whitespace-pre-line">{selectedItem.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Atualizar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {activeTab === 'volunteers' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.id, 'active')}
                        disabled={selectedItem.status === 'active' || isProcessing}
                        className={`px-3 py-2 rounded ${
                          selectedItem.status === 'active' || isProcessing
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        Ativar
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.id, 'inactive')}
                        disabled={selectedItem.status === 'inactive' || isProcessing}
                        className={`px-3 py-2 rounded ${
                          selectedItem.status === 'inactive' || isProcessing
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        Desativar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.id, 'pending')}
                        disabled={selectedItem.status === 'pending' || isProcessing}
                        className={`px-3 py-2 rounded ${
                          selectedItem.status === 'pending' || isProcessing
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        Pendente
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.id, 'approved')}
                        disabled={selectedItem.status === 'approved' || isProcessing}
                        className={`px-3 py-2 rounded ${
                          selectedItem.status === 'approved' || isProcessing
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        Aprovar
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus(selectedItem.id, 'rejected')}
                        disabled={selectedItem.status === 'rejected' || isProcessing}
                        className={`px-3 py-2 rounded ${
                          selectedItem.status === 'rejected' || isProcessing
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVolunteersPage; 