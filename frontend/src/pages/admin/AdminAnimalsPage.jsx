import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminAnimalsPage = () => {
  const [animals, setAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const animalsPerPage = 10;

  useEffect(() => {
    fetchAnimals();
  }, [filter, currentPage]);

  const fetchAnimals = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get('/api/admin/animals', {
        params: {
          type: filter.type || undefined,
          status: filter.status !== 'all' ? filter.status : undefined,
          search: filter.search || undefined,
          page: currentPage,
          limit: animalsPerPage
        }
      });
      
      setAnimals(response.data.animals || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar animais:', error);
      toast.error('Não foi possível carregar os animais');
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

  const handleDeleteClick = (animal) => {
    setAnimalToDelete(animal);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!animalToDelete) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`/api/admin/animals/${animalToDelete.id}`);
      
      // Remover o animal da lista
      setAnimals(prevAnimals => 
        prevAnimals.filter(animal => animal.id !== animalToDelete.id)
      );
      
      toast.success('Animal removido com sucesso');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao excluir animal:', error);
      toast.error('Não foi possível excluir o animal');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilter({
      type: '',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statuses = {
      'available': 'Disponível',
      'pending': 'Em processo',
      'adopted': 'Adotado'
    };
    
    return statuses[status] || status;
  };

  // Retorna a classe CSS apropriada para o status
  const getStatusClass = (status) => {
    const classes = {
      'available': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'adopted': 'bg-blue-100 text-blue-800'
    };
    
    return `${classes[status] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium`;
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Animais</h1>
        <Link to="/admin/animals/new" className="custom-btn-primary">
          Cadastrar Novo Animal
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
              placeholder="Nome, descrição, raça..."
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
              <option value="">Todos</option>
              <option value="dog">Cachorro</option>
              <option value="cat">Gato</option>
              <option value="bird">Ave</option>
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
              <option value="available">Disponível</option>
              <option value="pending">Em processo</option>
              <option value="adopted">Adotado</option>
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
      
      {/* Lista de animais */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : animals.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID/Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Raça
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idade/Gênero
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
                  {animals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={animal.images?.[0] || '/images/animal-placeholder.jpg'}
                              alt={animal.name}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{animal.name}</div>
                            <div className="text-sm text-gray-500">#{animal.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {animal.type === 'dog' ? 'Cachorro' : 
                          animal.type === 'cat' ? 'Gato' : 
                          animal.type === 'bird' ? 'Ave' : 
                          animal.type === 'other' ? 'Outro' : animal.type}
                        </div>
                        <div className="text-sm text-gray-500">{animal.breed || 'Não informado'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {animal.age ? `${animal.age} ${
                            animal.ageUnit === 'days' ? (animal.age === 1 ? 'dia' : 'dias') : 
                            animal.ageUnit === 'months' ? (animal.age === 1 ? 'mês' : 'meses') : 
                            animal.ageUnit === 'years' ? (animal.age === 1 ? 'ano' : 'anos') : 
                            animal.ageUnit
                          }` : 'Não informado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {animal.gender === 'male' ? 'Macho' : 
                          animal.gender === 'female' ? 'Fêmea' : 
                          'Não informado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(animal.adoptionStatus)}>
                          {translateStatus(animal.adoptionStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/animals/${animal.id}/edit`} 
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(animal)}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum animal encontrado</h3>
          <p className="text-gray-500 mb-6">
            {filter.search || filter.type || filter.status !== 'all'
              ? 'Nenhum animal corresponde aos critérios de busca.'
              : 'Não há animais cadastrados no sistema.'}
          </p>
          <Link to="/admin/animals/new" className="custom-btn-primary">
            Cadastrar Novo Animal
          </Link>
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir <span className="font-semibold">{animalToDelete?.name}</span>?
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

export default AdminAnimalsPage; 