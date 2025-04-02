import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    period: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  const donationsPerPage = 10;

  useEffect(() => {
    fetchDonations();
  }, [filter, currentPage]);

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/donations', {
        params: {
          status: filter.status !== 'all' ? filter.status : undefined,
          period: filter.period !== 'all' ? filter.period : undefined,
          search: filter.search || undefined,
          page: currentPage,
          limit: donationsPerPage
        }
      });
      
      setDonations(response.data.donations || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalAmount(response.data.totalAmount || 0);
    } catch (error) {
      console.error('Erro ao buscar doações:', error);
      toast.error('Não foi possível carregar as doações');
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

  const viewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDetails(true);
  };

  const resetFilters = () => {
    setFilter({
      status: 'all',
      period: 'all',
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

  // Formatar valor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statuses = {
      'completed': 'Concluída',
      'pending': 'Pendente',
      'failed': 'Falha',
      'refunded': 'Reembolsada'
    };
    
    return statuses[status] || status;
  };

  // Retorna a classe CSS apropriada para o status
  const getStatusClass = (status) => {
    const classes = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    
    return `${classes[status] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium`;
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Doações</h1>
        <p className="text-gray-500 mt-1">
          Total recebido: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </p>
      </div>
      
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              name="search"
              placeholder="Nome, email, ID..."
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
              <option value="completed">Concluídas</option>
              <option value="pending">Pendentes</option>
              <option value="failed">Falhas</option>
              <option value="refunded">Reembolsadas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              name="period"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter.period}
              onChange={handleFilterChange}
            >
              <option value="all">Todo período</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="year">Este ano</option>
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
      
      {/* Lista de doações */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : donations.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doador
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
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
                  {donations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{donation.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {donation.anonymous ? 'Doação anônima' : donation.donorName}
                        </div>
                        {!donation.anonymous && (
                          <div className="text-sm text-gray-500">{donation.donorEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(donation.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(donation.status)}>
                          {translateStatus(donation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewDonationDetails(donation)}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma doação encontrada</h3>
          <p className="text-gray-500 mb-6">
            {filter.search || filter.status !== 'all' || filter.period !== 'all'
              ? 'Nenhuma doação corresponde aos critérios de busca.'
              : 'Não há doações registradas no sistema.'}
          </p>
        </div>
      )}
      
      {/* Modal de detalhes da doação */}
      {showDetails && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Doação</h3>
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
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID da Doação</h4>
                  <p className="text-gray-900">#{selectedDonation.id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={getStatusClass(selectedDonation.status)}>
                    {translateStatus(selectedDonation.status)}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Valor</h4>
                  <p className="text-gray-900 font-semibold">{formatCurrency(selectedDonation.amount)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Data</h4>
                  <p className="text-gray-900">{formatDate(selectedDonation.createdAt)}</p>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Doador</h4>
                  {selectedDonation.anonymous ? (
                    <p className="text-gray-900">Doação anônima</p>
                  ) : (
                    <div>
                      <p className="text-gray-900">{selectedDonation.donorName}</p>
                      <p className="text-gray-500">{selectedDonation.donorEmail}</p>
                      {selectedDonation.donorPhone && (
                        <p className="text-gray-500">{selectedDonation.donorPhone}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedDonation.campaign && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Campanha</h4>
                    <p className="text-gray-900">{selectedDonation.campaign}</p>
                  </div>
                )}
                
                {selectedDonation.message && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Mensagem</h4>
                    <p className="text-gray-900 whitespace-pre-line">{selectedDonation.message}</p>
                  </div>
                )}
                
                {selectedDonation.paymentMethod && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Método de Pagamento</h4>
                    <p className="text-gray-900">
                      {selectedDonation.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                       selectedDonation.paymentMethod === 'pix' ? 'PIX' :
                       selectedDonation.paymentMethod === 'bank_transfer' ? 'Transferência Bancária' :
                       selectedDonation.paymentMethod === 'boleto' ? 'Boleto' :
                       selectedDonation.paymentMethod}
                    </p>
                  </div>
                )}
                
                {selectedDonation.transactionId && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">ID da Transação</h4>
                    <p className="text-gray-900 font-mono">{selectedDonation.transactionId}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end border-t border-gray-200 pt-4">
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

export default AdminDonationsPage; 