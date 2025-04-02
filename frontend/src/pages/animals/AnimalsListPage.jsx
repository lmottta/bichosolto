import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AnimalsListPage = () => {
  const [animals, setAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    size: '',
    gender: '',
    adoptionStatus: 'available'
  });

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/animals', {
          params: {
            ...filters,
            search: searchTerm,
          }
        });
        setAnimals(response.data.animals || []);
      } catch (error) {
        console.error('Erro ao buscar animais:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimals();
  }, [filters, searchTerm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8 text-center">Animais para Adoção</h1>
      
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nome ou descrição..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              name="type"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.type}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
            <select
              name="size"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.size}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
            <select
              name="gender"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.gender}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="male">Macho</option>
              <option value="female">Fêmea</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Lista de animais */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : animals.length > 0 ? (
        <div className="animal-card-grid">
          {animals.map((animal) => (
            <div key={animal.id} className="card-animal overflow-hidden">
              <figure className="h-48 w-full overflow-hidden">
                <img
                  src={animal.images?.[0] || '/images/animal-placeholder.jpg'}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
              </figure>
              <div className="p-4">
                <h3 className="text-xl font-semibold">{animal.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {animal.type}
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {animal.breed}
                  </span>
                </div>
                <p className="mt-2 text-gray-600 line-clamp-2">{animal.description}</p>
                <div className="mt-4">
                  <Link
                    to={`/animals/${animal.id}`}
                    className="custom-btn-primary inline-block w-full text-center"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700">Nenhum animal encontrado com os filtros selecionados.</h3>
          <p className="mt-2 text-gray-500">Tente ajustar seus filtros ou volte mais tarde.</p>
        </div>
      )}
    </div>
  );
};

export default AnimalsListPage; 