import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AnimalDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    message: '',
  });

  useEffect(() => {
    const fetchAnimalDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/animals/${id}`);
        setAnimal(response.data);
        
        // Preencher formulário com dados do usuário se estiver autenticado
        if (isAuthenticated && user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do animal:', error);
        toast.error('Não foi possível carregar os detalhes do animal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimalDetails();
  }, [id, isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitAdoption = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await axios.post(`/api/animals/${id}/adopt`, formData);
      
      toast.success('Solicitação de adoção enviada com sucesso!');
      setShowAdoptModal(false);
    } catch (error) {
      console.error('Erro ao enviar solicitação de adoção:', error);
      toast.error(error.response?.data?.message || 'Erro ao processar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatação de idade
  const formatAge = (age, ageUnit) => {
    if (!age) return 'Idade desconhecida';
    
    const units = {
      days: ['dia', 'dias'],
      months: ['mês', 'meses'],
      years: ['ano', 'anos'],
    };
    
    const unit = units[ageUnit] || ['unidade', 'unidades'];
    return `${age} ${age === 1 ? unit[0] : unit[1]}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Animal não encontrado</h2>
        <p className="mt-2 text-gray-500">O animal que você está procurando não existe ou foi removido.</p>
        <Link to="/animals" className="custom-btn-primary inline-block mt-6">
          Voltar para lista de animais
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex">
          <Link to="/" className="text-gray-500 hover:text-primary-500">Início</Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link to="/animals" className="text-gray-500 hover:text-primary-500">Animais</Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">{animal.name}</span>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Coluna de imagens */}
          <div>
            <div className="rounded-lg overflow-hidden h-80 bg-gray-100 mb-4">
              {animal.images && animal.images.length > 0 ? (
                <img 
                  src={animal.images[activeImage]} 
                  alt={animal.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">Sem imagem</span>
                </div>
              )}
            </div>
            
            {/* Miniaturas */}
            {animal.images && animal.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto py-2">
                {animal.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-md overflow-hidden flex-shrink-0 ${
                      activeImage === idx ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <img src={img} alt={`${animal.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Coluna de informações */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{animal.name}</h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {animal.type}
              </span>
              {animal.breed && (
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  {animal.breed}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                animal.adoptionStatus === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : animal.adoptionStatus === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {animal.adoptionStatus === 'available' ? 'Disponível' : 
                 animal.adoptionStatus === 'pending' ? 'Em processo' : 'Adotado'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Idade</h3>
                <p>{animal.age ? formatAge(animal.age, animal.ageUnit) : 'Não informada'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gênero</h3>
                <p>{animal.gender === 'male' ? 'Macho' : animal.gender === 'female' ? 'Fêmea' : 'Não informado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Porte</h3>
                <p>
                  {animal.size === 'small' ? 'Pequeno' : 
                   animal.size === 'medium' ? 'Médio' :
                   animal.size === 'large' ? 'Grande' :
                   animal.size === 'extra_large' ? 'Muito grande' : 'Não informado'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cor</h3>
                <p>{animal.color || 'Não informada'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vacinado</h3>
                <p>{animal.isVaccinated ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Castrado</h3>
                <p>{animal.isNeutered ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Necessidades Especiais</h3>
                <p>{animal.isSpecialNeeds ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Localização</h3>
                <p>{animal.city}, {animal.state}</p>
              </div>
            </div>
            
            {animal.adoptionStatus === 'available' && (
              <button
                onClick={() => setShowAdoptModal(true)}
                className="custom-btn-primary w-full py-3"
              >
                Quero Adotar
              </button>
            )}
          </div>
        </div>
        
        {/* Descrição e informações adicionais */}
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Sobre {animal.name}</h2>
          <p className="mb-6 text-gray-700 whitespace-pre-line">{animal.description}</p>
          
          {animal.healthStatus && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Condição de Saúde</h3>
              <p className="text-gray-700 whitespace-pre-line">{animal.healthStatus}</p>
            </div>
          )}
          
          {animal.isSpecialNeeds && animal.specialNeedsDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Necessidades Especiais</h3>
              <p className="text-gray-700 whitespace-pre-line">{animal.specialNeedsDescription}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de adoção */}
      {showAdoptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Solicitar adoção de {animal.name}</h2>
                <button
                  onClick={() => setShowAdoptModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitAdoption}>
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
                      <span className="label-text">Endereço</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cidade</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Estado</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
                
                <div className="form-control mb-6">
                  <label className="label">
                    <span className="label-text">Por que você deseja adotar este animal?</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full h-32"
                    placeholder="Conte-nos um pouco sobre você e por que deseja adotar este animal..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAdoptModal(false)}
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
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
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

export default AnimalDetailsPage; 