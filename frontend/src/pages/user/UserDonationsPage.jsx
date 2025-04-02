import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const UserDonationsPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  // Buscar doações do usuário
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/donations/user/me', {
          params: { page: currentPage, limit: 10 }
        })
        
        setDonations(response.data.donations)
        setTotalPages(response.data.pagination.totalPages)
      } catch (error) {
        console.error('Erro ao buscar doações:', error)
        toast.error('Erro ao carregar doações. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDonations()
  }, [currentPage])

  // Manipular mudança de página
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Abrir modal para upload de comprovante
  const handleOpenReceiptModal = (donation) => {
    setSelectedDonation(donation)
    setShowReceiptModal(true)
  }

  // Fechar modal
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false)
    setSelectedDonation(null)
    setReceiptFile(null)
  }

  // Manipular seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  // Enviar comprovante
  const handleUploadReceipt = async (e) => {
    e.preventDefault()
    
    if (!receiptFile) {
      toast.error('Selecione um arquivo para enviar')
      return
    }
    
    try {
      setUploadingReceipt(true)
      
      const formData = new FormData()
      formData.append('receipt', receiptFile)
      
      const response = await axios.post(
        `/api/donations/${selectedDonation.id}/receipt`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      toast.success('Comprovante enviado com sucesso')
      
      // Atualizar a lista de doações
      setDonations(prev => 
        prev.map(donation => 
          donation.id === selectedDonation.id 
            ? { ...donation, receiptImage: response.data.receiptImage } 
            : donation
        )
      )
      
      handleCloseReceiptModal()
      
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error)
      toast.error(error.response?.data?.message || 'Erro ao enviar comprovante. Tente novamente.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  // Formatar valor da doação
  const formatCurrency = (value, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  // Renderizar badge de status
  const renderStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmada' },
      delivered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Entregue' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-medium`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Minhas Doações</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : donations.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinatário
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
                  {donations.map((donation) => (
                    <tr key={donation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donation.type === 'financial' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {donation.type === 'financial' ? 'Financeira' : 'Item'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {donation.type === 'financial' ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(donation.amount, donation.currency)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Método: {{
                                pix: 'PIX',
                                credit_card: 'Cartão de Crédito',
                                bank_transfer: 'Transferência Bancária'
                              }[donation.paymentMethod] || donation.paymentMethod}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {donation.itemName} ({donation.itemQuantity})
                            </p>
                            <p className="text-sm text-gray-500">
                              Categoria: {{
                                food: 'Alimentos',
                                medicine: 'Medicamentos',
                                toys: 'Brinquedos',
                                accessories: 'Acessórios',
                                cleaning: 'Produtos de Limpeza',
                                other: 'Outros'
                              }[donation.itemCategory] || donation.itemCategory}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {donation.recipient?.name || 'ONG'}
                        </p>
                        {donation.campaign && (
                          <p className="text-xs text-gray-500">
                            Campanha: {donation.campaign.title}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(donation.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {donation.type === 'financial' && !donation.receiptImage && (
                          <button
                            onClick={() => handleOpenReceiptModal(donation)}
                            className="text-primary hover:text-primary-dark mr-3"
                          >
                            Enviar Comprovante
                          </button>
                        )}
                        
                        {donation.receiptImage && (
                          <a 
                            href={donation.receiptImage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark"
                          >
                            Ver Comprovante
                          </a>
                        )}
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
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Próxima
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Você ainda não fez nenhuma doação</h2>
          <p className="text-gray-600 mb-6">Ajude os animais necessitados com uma doação financeira ou de itens.</p>
          
          <Link 
            to="/donate" 
            className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
          >
            Fazer uma Doação
          </Link>
        </div>
      )}
      
      {/* Modal para upload de comprovante */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Enviar Comprovante de Doação</h3>
            
            <form onSubmit={handleUploadReceipt}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Selecione o arquivo do comprovante
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF, PDF. Tamanho máximo: 5MB
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseReceiptModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={uploadingReceipt || !receiptFile}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {uploadingReceipt ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDonationsPage