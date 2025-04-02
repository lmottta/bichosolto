import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get('/api/reports/user');
        setReports(response.data.reports || []);
      } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        toast.error('Não foi possível carregar suas denúncias');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  // Filtra os reports com base no status selecionado
  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.status === filter);

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

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8">Minhas Denúncias</h1>
      
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md ${
              filter === 'pending' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-md ${
              filter === 'in_progress' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Em andamento
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-md ${
              filter === 'resolved' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Resolvidas
          </button>
        </div>
      </div>
      
      {/* Lista de denúncias */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{report.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {
                        report.reportType === 'animal_abuse' ? 'Maus-tratos' :
                        report.reportType === 'abandoned_animal' ? 'Animal abandonado' :
                        report.reportType === 'illegal_breeding' ? 'Criação ilegal' :
                        report.reportType === 'illegal_trade' ? 'Comércio ilegal' :
                        report.reportType
                      }
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {report.description.substring(0, 50)}...
                    </div>
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
                      onClick={() => {/* Implementar visualização detalhada */}}
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma denúncia encontrada</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? 'Você ainda não fez nenhuma denúncia.' 
              : `Você não tem denúncias com o status "${translateStatus(filter)}".`}
          </p>
          <Link to="/report-abuse" className="custom-btn-primary inline-block">
            Fazer uma denúncia
          </Link>
        </div>
      )}
      
      {/* Link para fazer nova denúncia */}
      {filteredReports.length > 0 && (
        <div className="mt-6 text-center">
          <Link to="/report-abuse" className="custom-btn-primary inline-block">
            Fazer nova denúncia
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserReportsPage; 