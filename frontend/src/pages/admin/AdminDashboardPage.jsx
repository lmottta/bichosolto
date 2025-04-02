import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAnimals: 0,
    availableAnimals: 0,
    pendingAdoptions: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalReports: 0,
    pendingReports: 0,
    totalDonations: 0,
    totalVolunteers: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obter estatísticas
        const statsResponse = await axios.get('/api/admin/stats');
        setStats(statsResponse.data);
        
        // Obter denúncias recentes
        const reportsResponse = await axios.get('/api/admin/reports/recent');
        setRecentReports(reportsResponse.data.reports || []);
      } catch (error) {
        console.error('Erro ao obter dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Formatar data
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Painel de Controle</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card - Animais */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Animais para Adoção</p>
              <h2 className="text-3xl font-bold mt-1">{stats.totalAnimals}</h2>
            </div>
            <div className="rounded-full bg-blue-100 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Disponíveis</p>
              <p className="font-semibold">{stats.availableAnimals}</p>
            </div>
            <div>
              <p className="text-gray-500">Adoções Pendentes</p>
              <p className="font-semibold">{stats.pendingAdoptions}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/animals" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
              Ver detalhes →
            </Link>
          </div>
        </div>
        
        {/* Card - Eventos */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Eventos</p>
              <h2 className="text-3xl font-bold mt-1">{stats.totalEvents}</h2>
            </div>
            <div className="rounded-full bg-green-100 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Próximos Eventos</p>
              <p className="font-semibold">{stats.upcomingEvents}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/events" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
              Ver detalhes →
            </Link>
          </div>
        </div>
        
        {/* Card - Denúncias */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Denúncias</p>
              <h2 className="text-3xl font-bold mt-1">{stats.totalReports}</h2>
            </div>
            <div className="rounded-full bg-yellow-100 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Pendentes</p>
              <p className="font-semibold">{stats.pendingReports}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/reports" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
              Ver detalhes →
            </Link>
          </div>
        </div>
        
        {/* Card - Doações/Voluntários */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Doações</p>
              <h2 className="text-3xl font-bold mt-1">R$ {stats.totalDonations.toFixed(2)}</h2>
            </div>
            <div className="rounded-full bg-purple-100 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Voluntários</p>
              <p className="font-semibold">{stats.totalVolunteers}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/donations" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
              Ver detalhes →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Denúncias recentes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Denúncias Recentes</h2>
          <Link to="/admin/reports" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Ver todas
          </Link>
        </div>
        
        {recentReports.length > 0 ? (
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
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{report.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {
                          report.reportType === 'animal_abuse' ? 'Maus-tratos' :
                          report.reportType === 'abandoned_animal' ? 'Animal abandonado' :
                          report.reportType === 'illegal_breeding' ? 'Criação ilegal' :
                          report.reportType === 'illegal_trade' ? 'Comércio ilegal' :
                          report.reportType
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          report.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {
                          report.status === 'pending' ? 'Pendente' :
                          report.status === 'in_progress' ? 'Em andamento' :
                          report.status === 'resolved' ? 'Resolvido' :
                          report.status === 'closed' ? 'Fechado' :
                          report.status
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/admin/reports/${report.id}`} className="text-primary-600 hover:text-primary-900">
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhuma denúncia recente.</p>
        )}
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/animals/new"
          className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Cadastrar Animal</span>
          </div>
        </Link>
        
        <Link
          to="/admin/events/new"
          className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Criar Evento</span>
          </div>
        </Link>
        
        <Link
          to="/admin/reports"
          className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-medium">Gerenciar Denúncias</span>
          </div>
        </Link>
        
        <Link
          to="/admin/volunteers"
          className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-medium">Gerenciar Voluntários</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 