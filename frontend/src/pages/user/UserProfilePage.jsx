import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';

console.log('Componente carregado e usando instância api com baseURL:', api.defaults.baseURL);

const UserProfilePage = () => {
  const { user, updateUserInfo, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Inicializar dados do perfil quando o usuário é carregado - otimizado com useEffect
  useEffect(() => {
    if (user) {
      // Usar função de atualização para evitar dependência no estado anterior
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Definir imagePreview se o usuário já tiver uma imagem
      if (user.profileImageUrl) {
        setImagePreview(user.profileImageUrl);
      } else if (user.profileImage) {
        // Verificar se a URL já inclui o domínio completo
        if (user.profileImage.startsWith('http')) {
          setImagePreview(user.profileImage);
        } else {
          // Caso contrário, usar a URL base da API (definida no env ou usar localhost como fallback)
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          setImagePreview(`${apiBaseUrl}${user.profileImage}`);
        }
      }
    }
  }, [user]);

  // Manipulador para mudanças nos campos do formulário - memoizado com useCallback
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);
  
  // Manipulador para o upload de imagem de perfil - memoizado com useCallback
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Verificar tipo e tamanho da imagem
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Formato de imagem inválido. Use JPEG ou PNG.');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('A imagem não pode ter mais que 5MB.');
      return;
    }
    
    setProfileImage(file);
    
    // Criar URL para prévia da imagem
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  }, []);

  // Enviar formulário de atualização de perfil - memoizado com useCallback
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validar senhas se estiver tentando alterar
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        toast.error('Por favor, informe sua senha atual');
        return;
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast.error('A nova senha e a confirmação não coincidem');
        return;
      }
      
      if (profileData.newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const dataToSend = { ...profileData };
      
      // Remover campos não necessários se não estiver alterando senha
      if (!dataToSend.newPassword) {
        delete dataToSend.currentPassword;
        delete dataToSend.newPassword;
        delete dataToSend.confirmPassword;
      }
      
      let profileResponse;
      
      // Se há uma nova imagem para upload, usar FormData
      if (profileImage) {
        console.log('Enviando atualização de perfil com nova imagem');
        const formData = new FormData();
        
        // Adicionar os dados de texto
        formData.append('name', dataToSend.name);
        formData.append('phone', dataToSend.phone || '');
        formData.append('address', dataToSend.address || '');
        formData.append('city', dataToSend.city || '');
        formData.append('state', dataToSend.state || '');
        formData.append('bio', dataToSend.bio || '');
        
        // Adicionar a imagem
        formData.append('profileImage', profileImage);
        
        // Log para debug
        console.log('FormData criado com sucesso, enviando para API');
        
        try {
          // Enviar com cabeçalho multipart/form-data
          profileResponse = await api.put('/api/users/me', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          console.log('Resposta da API após upload de imagem:', profileResponse.data);
        } catch (uploadError) {
          console.error('Erro específico no upload da imagem:', uploadError);
          throw uploadError;
        }
      } else {
        // Enviar os dados sem imagem normalmente
        profileResponse = await api.put('/api/users/me', {
          name: dataToSend.name,
          phone: dataToSend.phone,
          address: dataToSend.address,
          city: dataToSend.city,
          state: dataToSend.state,
          bio: dataToSend.bio
        });
      }
      
      // Se está alterando a senha, fazer uma chamada separada
      if (dataToSend.newPassword) {
        await api.put('/api/users/me/password', {
          currentPassword: dataToSend.currentPassword,
          newPassword: dataToSend.newPassword
        });
      }
      
      // Atualizar o contexto de autenticação com as novas informações
      const updateSuccess = await updateUserInfo(profileResponse.data);
      
      if (!updateSuccess) {
        console.error('Falha ao atualizar informações do usuário no contexto');
        toast.error('Erro ao atualizar perfil. Tente novamente.');
        return;
      }
      
      // Atualizar o preview da imagem se tiver uma URL na resposta
      if (profileResponse.data.profileImageUrl) {
        // Adicionar um timestamp para evitar cache
        const timestamp = new Date().getTime();
        const imageUrl = `${profileResponse.data.profileImageUrl}?t=${timestamp}`;
        setImagePreview(imageUrl);
        console.log('Imagem de perfil atualizada:', imageUrl);
      }
      
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      
      // Limpar a referência de arquivo após o upload bem-sucedido
      setProfileImage(null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      // Extrair mensagem de erro específica da API
      let errorMessage = 'Erro ao atualizar o perfil. Tente novamente.';
      
      if (error.response) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Erro de validação da API
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } else if (error.response.data.message) {
          // Mensagem de erro genérica da API
          errorMessage = error.response.data.message;
        } else if (error.response.status === 413) {
          errorMessage = "A imagem enviada é muito grande. O tamanho máximo é 5MB.";
        }
      } else if (error.request) {
        // O pedido foi feito mas não houve resposta do servidor
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [profileData, profileImage, updateUserInfo]);

  // Componente de visualização do perfil - memoizado com useMemo
  const renderViewMode = useMemo(() => {
    if (!user) return null;
    
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Informações Pessoais</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
          >
            Editar Perfil
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Avatar/Logo */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-2">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={`${user.name || 'Usuário'}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    // Tentar URL alternativa se a principal falhar
                    if (user.profileImage) {
                      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                      e.target.src = `${apiBaseUrl}${user.profileImage}`;
                    } else {
                      // Fallback para ícone padrão em caso de erro
                      e.target.style.display = 'none';
                      e.target.parentNode.classList.add('bg-gray-200', 'text-gray-400', 'flex', 'items-center', 'justify-center');
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                      e.target.parentNode.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">{user.role === 'ong' ? 'Logo da ONG' : 'Avatar'}</p>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nome</h3>
              <p className="mt-1">{user.name || 'Não informado'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1">{user.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
              <p className="mt-1">{user.phone || 'Não informado'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
              <p className="mt-1">{user.address || 'Não informado'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Cidade</h3>
              <p className="mt-1">{user.city || 'Não informado'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Estado</h3>
              <p className="mt-1">{user.state || 'Não informado'}</p>
            </div>
          </div>
        </div>
        
        {user.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500">Sobre mim</h3>
            <p className="mt-1 whitespace-pre-line">{user.bio}</p>
          </div>
        )}
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/my-donations" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
            <h3 className="font-semibold mb-1">Minhas Doações</h3>
            <p className="text-sm text-gray-600">Visualize seu histórico de doações</p>
          </Link>
          
          <Link to="/my-reports" className="bg-amber-50 hover:bg-amber-100 p-4 rounded-lg text-center transition-colors">
            <h3 className="font-semibold mb-1">Minhas Denúncias</h3>
            <p className="text-sm text-gray-600">Acompanhe suas denúncias</p>
          </Link>
          
          <Link to="/my-volunteering" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors">
            <h3 className="font-semibold mb-1">Voluntariado</h3>
            <p className="text-sm text-gray-600">Gerenciar atividades voluntárias</p>
          </Link>
        </div>
      </>
    );
  }, [user]);

  // Componente de edição do perfil - memoizado com useMemo
  const renderEditMode = useMemo(() => {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Editar Perfil</h2>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Upload de imagem de perfil */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-3">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('bg-gray-200', 'text-gray-400', 'flex', 'items-center', 'justify-center');
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                    e.target.parentNode.appendChild(icon);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
            </div>
            
            <label className="cursor-pointer bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-focus transition-colors">
              <span>{user?.role === 'ong' ? 'Alterar Logo' : 'Alterar Avatar'}</span>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
            
            <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG (Máx: 5MB)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nome</span>
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={true}
              />
              <span className="text-xs text-gray-500 mt-1">O email não pode ser alterado</span>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Telefone</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Endereço</span>
              </label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cidade</span>
              </label>
              <input
                type="text"
                name="city"
                value={profileData.city}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Estado</span>
              </label>
              <input
                type="text"
                name="state"
                value={profileData.state}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Sobre mim</span>
              </label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                rows="4"
                className="textarea textarea-bordered w-full"
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
          <p className="text-sm text-gray-600 mb-4">Deixe os campos em branco se não deseja alterar sua senha</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Senha Atual</span>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={profileData.currentPassword}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nova Senha</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={profileData.newPassword}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirmar Nova Senha</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={profileData.confirmPassword}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="custom-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Salvando...
                </>
              ) : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </>
    );
  }, [profileData, imagePreview, isSubmitting, handleInputChange, handleImageChange, handleSubmit, user]);

  // Renderização condicional com indicador de carregamento
  if (authLoading || isSubmitting || !user) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {isEditing ? renderEditMode : renderViewMode}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;