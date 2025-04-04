import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Função para verificar se o link está ativo
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  // Função para fechar o menu do usuário
  const closeUserMenu = () => {
    setUserMenuOpen(false)
  }

  // Função para fechar a sidebar em dispositivos móveis
  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  // Fechar o menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container') && !event.target.closest('.user-menu-button')) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fechar menus ao mudar de rota
  useEffect(() => {
    closeUserMenu()
  }, [location])

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar superior */}
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="flex-none">
          <button 
            className="btn btn-square btn-ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        <div className="flex-1">
          <Link to="/admin" className="btn btn-ghost normal-case text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
            <span className="hidden md:inline">Bicho Solto - Admin</span>
          </Link>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-end user-menu-container">
            <button
              className="btn btn-ghost btn-circle avatar user-menu-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {user?.profileImageUrl ? (
                <div className="w-10 rounded-full">
                  <img 
                    alt="Avatar do administrador" 
                    src={user.profileImageUrl}
                    onError={(e) => {
                      e.target.onerror = null;
                      // Tentar URL alternativa se a principal falhar
                      if (user?.profileImage) {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                        if (!user.profileImage.startsWith('http')) {
                          e.target.src = `${apiBaseUrl}${user.profileImage}`;
                        } else {
                          e.target.src = user.profileImage;
                        }
                      } else {
                        // Não definir uma imagem padrão, deixar o contorno aparecer
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-primary-focus border border-primary/30 bg-base-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>
            {userMenuOpen && (
              <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 text-base-content">
                <li className="font-semibold">
                  <span>{user?.name || 'Administrador'}</span>
                </li>
                <li>
                  <Link to="/profile" onClick={closeUserMenu}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Perfil
                  </Link>
                </li>
                <li>
                  <Link to="/" onClick={closeUserMenu}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Voltar ao Site
                  </Link>
                </li>
                <li>
                  <button onClick={() => { closeUserMenu(); logout(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-base-100 shadow-lg ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 overflow-hidden`}>
          <ul className="menu p-2 w-64">
            <li className={isActive('/admin') && !isActive('/admin/animais') && !isActive('/admin/eventos') && !isActive('/admin/denuncias') && !isActive('/admin/doacoes') && !isActive('/admin/voluntarios') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {isSidebarOpen && <span>Dashboard</span>}
              </Link>
            </li>
            <li className={isActive('/admin/animais') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin/animais" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                {isSidebarOpen && <span>Animais</span>}
              </Link>
            </li>
            <li className={isActive('/admin/eventos') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin/eventos" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isSidebarOpen && <span>Eventos</span>}
              </Link>
            </li>
            <li className={isActive('/admin/denuncias') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin/denuncias" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {isSidebarOpen && <span>Denúncias</span>}
              </Link>
            </li>
            <li className={isActive('/admin/doacoes') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin/doacoes" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSidebarOpen && <span>Doações</span>}
              </Link>
            </li>
            <li className={isActive('/admin/voluntarios') ? 'bordered border-l-4 border-primary' : ''}>
              <Link to="/admin/voluntarios" onClick={closeSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isSidebarOpen && <span>Voluntários</span>}
              </Link>
            </li>
          </ul>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout