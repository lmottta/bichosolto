import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const reportsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, [filter, currentPage, searchTerm]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/reports', {
        params: {
          status: filter !== 'all' ? filter : undefined,
          search: searchTerm || undefined,
          page: currentPage,
          limit: reportsPerPage
        }
      });
      
      setReports(response.data.reports || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar denúncias:', error);
      toast.error('Não foi possível carregar as denúncias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setUpdatingStatus(true);
      
      await axios.put(`/api/admin/reports/${reportId}/status`, {
        status: newStatus
      });
      
      // Atualizar o relatório na lista
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus } 
            : report
        )
      );
      
      // Atualizar o relatório selecionado se estiver aberto
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => ({ ...prev, status: newStatus }));
      }
      
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar o status da denúncia');
    } finally {
      setUpdatingStatus(false);
    }
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

  // Traduzir tipo de denúncia
  const translateReportType = (type) => {
    const types = {
      'animal_abuse': 'Maus-tratos',
      'abandoned_animal': 'Animal abandonado',
      'illegal_breeding': 'Criação ilegal',
      'illegal_trade': 'Comércio ilegal',
      'other': 'Outro'
    };
    
    return types[type] || type;
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statuses = {
      'pending': 'Pendente',
      'in_progress': 'Em andamento',
      'resolved': 'Resolvido',
      'closed': 'Fechado'
    };
    
    return statuses[status] || status;
  };

  // Retorna a classe CSS apropriada baseada no status
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge-pending';
      case 'in_progress':
        return 'status-badge-in-progress';
      case 'resolved':
        return 'status-badge-resolved';
      case 'closed':
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Denúncias</h1>
      </div>
      
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por ID, local, descrição..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
          </div>
          
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
                setCurrentPage(1);
              }}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de denúncias */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : reports.length > 0 ? (
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
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
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
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{report.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {translateReportType(report.reportType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.city}, {report.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(report.status)}>
                          {translateStatus(report.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(report)}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma denúncia encontrada</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Nenhuma denúncia corresponde aos critérios de busca.'
              : filter !== 'all'
              ? `Não há denúncias com status "${translateStatus(filter)}".`
              : 'Não há denúncias registradas no sistema.'}
          </p>
        </div>
      )}
      
      {/* Modal de detalhes da denúncia */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Detalhes da Denúncia</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ID da Denúncia</h3>
                  <p className="mt-1">#{selectedReport.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo de Denúncia</h3>
                  <p className="mt-1">{translateReportType(selectedReport.reportType)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">
                    <span className={getStatusClass(selectedReport.status)}>
                      {translateStatus(selectedReport.status)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data da Denúncia</h3>
                  <p className="mt-1">{formatDate(selectedReport.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Localização</h3>
                  <p className="mt-1">
                    {selectedReport.address && (
                      <>{selectedReport.address}, </>
                    )}
                    {selectedReport.city}, {selectedReport.state}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Denunciante</h3>
                  <p className="mt-1">
                    {selectedReport.anonymous 
                      ? 'Denúncia anônima'
                      : selectedReport.user?.name || 'Não identificado'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                  <p className="mt-1 whitespace-pre-line">{selectedReport.description}</p>
                </div>
                
                {selectedReport.evidence && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Evidências</h3>
                    <p className="mt-1 whitespace-pre-line">{selectedReport.evidence}</p>
                  </div>
                )}
                
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Imagens</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {selectedReport.images.map((img, idx) => (
                        <div key={idx} className="h-40 rounded-md overflow-hidden">
                          <img 
                            src={img} 
                            alt={`Evidência ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedReport.notes && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Notas Internas</h3>
                    <p className="mt-1 whitespace-pre-line">{selectedReport.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold mb-4">Atualizar Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'pending')}
                    disabled={selectedReport.status === 'pending' || updatingStatus}
                    className={`px-3 py-2 rounded ${
                      selectedReport.status === 'pending' 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    Pendente
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                    disabled={selectedReport.status === 'in_progress' || updatingStatus}
                    className={`px-3 py-2 rounded ${
                      selectedReport.status === 'in_progress' 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    Em andamento
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    disabled={selectedReport.status === 'resolved' || updatingStatus}
                    className={`px-3 py-2 rounded ${
                      selectedReport.status === 'resolved' 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Resolvido
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'closed')}
                    disabled={selectedReport.status === 'closed' || updatingStatus}
                    className={`px-3 py-2 rounded ${
                      selectedReport.status === 'closed' 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Fechado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage; 