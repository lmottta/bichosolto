import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const DonatePage = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [donationType, setDonationType] = useState('financial')
  const [ongs, setOngs] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [formData, setFormData] = useState({
    // Campos comuns
    recipientId: '',
    campaignId: '',
    message: '',
    isAnonymous: false,
    
    // Campos para doação financeira
    amount: '',
    currency: 'BRL',
    paymentMethod: 'pix',
    
    // Campos para doação de itens
    itemName: '',
    itemDescription: '',
    itemQuantity: 1,
    itemCategory: 'food',
    deliveryAddress: '',
    deliveryDate: ''
  })

  useEffect(() => {
    setPageLoaded(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Buscar ONGs
        const ongsResponse = await axios.get('/api/users', {
          params: { role: 'ong' },
          headers: {
            'X-Public-Request': 'true'
          }
        })
        setOngs(ongsResponse.data.filter(ong => ong.role === 'ong'))
        
        // Buscar campanhas de doação (eventos de arrecadação)
        const campaignsResponse = await axios.get('/api/events', {
          params: { eventType: 'fundraising', isActive: true },
          headers: {
            'X-Public-Request': 'true'
          }
        })
        setCampaigns(campaignsResponse.data.events)
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        toast.error('Erro ao carregar dados. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Validar formulário
  const validateForm = () => {
    if (!formData.recipientId) {
      toast.error('Selecione uma ONG para receber a doação')
      return false
    }
    
    if (donationType === 'financial' && (!formData.amount || formData.amount <= 0)) {
      toast.error('Informe um valor válido para a doação')
      return false
    }
    
    if (donationType === 'item' && !formData.itemName) {
      toast.error('Informe o nome do item a ser doado')
      return false
    }
    
    return true
  }

  // Enviar formulário de doação
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Se não estiver autenticado, mostrar opções
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    
    processDoação()
  }
  
  // Processar a doação após autenticação ou como anônima
  const processDoação = async () => {
    try {
      setIsLoading(true)
      
      // Formatar os dados antes de enviar
      const formattedData = {
        ...formData,
        // Garantir que o valor seja numérico para doações financeiras
        amount: donationType === 'financial' ? parseFloat(formData.amount) : undefined,
        // Garantir que a quantidade seja numérica para doações de itens
        itemQuantity: donationType === 'item' ? parseInt(formData.itemQuantity, 10) : undefined
      }
      
      // Enviar dados da doação para o backend
      const endpoint = donationType === 'financial' ? '/api/donations/financial' : '/api/donations/item'
      const response = await axios.post(endpoint, formattedData)
      
      toast.success(response.data.message)
      
      // Redirecionar para a página de comprovante ou agradecimento
      if (donationType === 'financial') {
        if (isAuthenticated) {
          navigate(`/my-donations?success=true&id=${response.data.donation.id}`)
        } else {
          // Limpar formulário após doação anônima
          setFormData({
            ...formData,
            amount: '',
            message: ''
          })
          toast.success('Doação realizada com sucesso! Obrigado pela sua contribuição.')
        }
      } else {
        // Limpar formulário após doação de item
        setFormData({
          ...formData,
          itemName: '',
          itemDescription: '',
          itemQuantity: 1,
          message: ''
        })
        toast.info('Obrigado pela sua doação! A ONG entrará em contato para combinar a entrega.')
      }
      
      setShowLoginPrompt(false)
      
    } catch (error) {
      console.error('Erro ao processar doação:', error)
      
      // Extrair mensagem de erro específica da API
      let errorMessage = 'Erro ao processar doação. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erro de validação da API
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else if (error.response.data.message) {
          // Mensagem de erro genérica da API
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        // O pedido foi feito mas não houve resposta do servidor
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Continuar como anônimo
  const handleAnonymousDonation = () => {
    setFormData({
      ...formData,
      isAnonymous: true
    })
    setShowLoginPrompt(false)
    processDoação()
  }
  
  // Redirecionar para login
  const handleLogin = () => {
    navigate('/login', { state: { from: '/donate' } })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Faça uma Doação</h1>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        {!isAuthenticated && (
          <div className="mb-6 p-3 bg-blue-50 text-blue-800 rounded-md">
            <p className="text-sm">
              <i className="fas fa-info-circle mr-2"></i>
              Você pode fazer doações sem precisar criar uma conta. No entanto, se quiser acompanhar suas doações, considere fazer login.
            </p>
          </div>
        )}
        
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Finalizar Doação</h3>
              <p className="mb-4">Como deseja continuar com sua doação?</p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleLogin}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-focus"
                >
                  Fazer login para acompanhar minha doação
                </button>
                <button 
                  onClick={handleAnonymousDonation}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Continuar como anônimo
                </button>
                <button 
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Tipo de Doação</h2>
          <div className="flex space-x-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${donationType === 'financial' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              onClick={() => setDonationType('financial')}
            >
              Doação Financeira
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${donationType === 'item' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              onClick={() => setDonationType('item')}
            >
              Doação de Itens
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de ONG */}
          <div>
            <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700">
              Selecione a ONG
            </label>
            <select
              id="recipientId"
              name="recipientId"
              value={formData.recipientId}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              required
            >
              <option value="">Selecione uma ONG</option>
              {ongs.map(ong => (
                <option key={ong.id} value={ong.id}>{ong.name}</option>
              ))}
            </select>
          </div>

          {/* Seleção de Campanha (opcional) */}
          {campaigns.length > 0 && (
            <div>
              <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700">
                Campanha (opcional)
              </label>
              <select
                id="campaignId"
                name="campaignId"
                value={formData.campaignId}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">Selecione uma campanha</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Campos específicos para doação financeira */}
          {donationType === 'financial' && (
            <>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Valor da Doação
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-12 pr-12 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  Forma de Pagamento
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="creditCard">Cartão de Crédito</option>
                  <option value="bankTransfer">Transferência Bancária</option>
                </select>
              </div>
            </>
          )}

          {/* Campos específicos para doação de itens */}
          {donationType === 'item' && (
            <>
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                  Nome do Item
                </label>
                <input
                  type="text"
                  name="itemName"
                  id="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
                  Descrição do Item
                </label>
                <textarea
                  name="itemDescription"
                  id="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                />
              </div>

              <div>
                <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  name="itemQuantity"
                  id="itemQuantity"
                  value={formData.itemQuantity}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  id="itemCategory"
                  name="itemCategory"
                  value={formData.itemCategory}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                >
                  <option value="food">Alimentos</option>
                  <option value="medicine">Medicamentos</option>
                  <option value="toys">Brinquedos</option>
                  <option value="accessories">Acessórios</option>
                  <option value="cleaning">Produtos de Limpeza</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div>
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">
                  Endereço de Entrega (opcional)
                </label>
                <textarea
                  name="deliveryAddress"
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                />
              </div>

              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">
                  Data de Entrega Preferencial (opcional)
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  id="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                />
              </div>
            </>
          )}

          {/* Campos comuns */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Mensagem (opcional)
            </label>
            <textarea
              name="message"
              id="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAnonymous"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
              Fazer doação anônima
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processando...' : 'Confirmar Doação'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 max-w-2xl mx-auto bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Informações Importantes</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Todas as doações são verificadas pelas ONGs parceiras.</li>
          <li>Para doações financeiras, você receberá um comprovante por e-mail.</li>
          <li>Para doações de itens, a ONG entrará em contato para combinar a entrega ou coleta.</li>
          <li>Sua doação faz a diferença na vida dos animais resgatados!</li>
        </ul>
      </div>
    </div>
  )
}

export default DonatePage