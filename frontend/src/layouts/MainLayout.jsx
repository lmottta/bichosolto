import { Outlet } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logoImg from '../img/logo.png'

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Detectar scroll para mudar o estilo da navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Função para fechar o menu móvel
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  // Função para fechar o menu do usuário
  const closeUserMenu = () => {
    setUserMenuOpen(false)
  }

  // Fechar os menus ao clicar fora deles
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Fechar menu móvel
      if (!event.target.closest('.mobile-menu-container') && !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false)
      }
      
      // Fechar menu do usuário
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
    closeMobileMenu()
    closeUserMenu()
  }, [location])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'navbar-glass shadow-md' : ''}`}>
        <nav className="navbar container mx-auto px-4">
          <div className="navbar-start">
            <div className="dropdown mobile-menu-container">
              <button 
                className="btn btn-ghost lg:hidden mobile-menu-button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              {mobileMenuOpen && (
                <ul className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                  <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
                  <li><Link to="/animals" onClick={closeMobileMenu}>Animais</Link></li>
                  <li><Link to="/report-abuse" onClick={closeMobileMenu}>Denunciar</Link></li>
                  <li><Link to="/donate" onClick={closeMobileMenu}>Doar</Link></li>
                  <li><Link to="/volunteer" onClick={closeMobileMenu}>Voluntariar</Link></li>
                  <li><Link to="/about" onClick={closeMobileMenu}>Sobre</Link></li>
                </ul>
              )}
            </div>
            <Link to="/" className="flex items-center">
              <img src={logoImg} alt="Bicho Solto" className="h-16 w-auto mr-2 animate-gentle-pulse" style={{ width: '80px', height: '80px' }} />
              <span className={`text-xl font-bold hidden md:inline ${isScrolled ? 'text-primary' : 'text-primary drop-shadow-text'}`}>Bicho Solto</span>
            </Link>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal p-0 gap-1">
              <li><Link to="/" className={`${location.pathname === '/' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Home</Link></li>
              <li><Link to="/animals" className={`${location.pathname === '/animals' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Animais</Link></li>
              <li><Link to="/report-abuse" className={`${location.pathname === '/report-abuse' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Denunciar</Link></li>
              <li><Link to="/donate" className={`${location.pathname === '/donate' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Doar</Link></li>
              <li><Link to="/volunteer" className={`${location.pathname === '/volunteer' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Voluntariar</Link></li>
              <li><Link to="/about" className={`${location.pathname === '/about' ? 'font-bold text-primary' : ''} ${isScrolled ? '' : 'drop-shadow-text'}`}>Sobre</Link></li>
            </ul>
          </div>
          <div className="navbar-end">
            {isAuthenticated ? (
              <div className="dropdown dropdown-end user-menu-container">
                <button
                  className="btn btn-ghost btn-circle avatar user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className={`w-10 rounded-full ${!user?.profileImageUrl ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100 border border-primary/30 bg-base-200 flex items-center justify-center' : ''}`}>
                    {user?.profileImageUrl ? (
                      <img 
                        alt="Avatar do usuário" 
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
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </button>
                {userMenuOpen && (
                  <ul className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52 z-50">
                    <li>
                      <Link to="/profile" className="justify-between" onClick={closeUserMenu}>
                        Perfil
                        <span className="badge">Novo</span>
                      </Link>
                    </li>
                    {user?.role === 'admin' && (
                      <li><Link to="/admin/dashboard" onClick={closeUserMenu}>Admin</Link></li>
                    )}
                    <li><Link to="/user/reports" onClick={closeUserMenu}>Minhas Denúncias</Link></li>
                    <li><Link to="/user/adoptions" onClick={closeUserMenu}>Minhas Adoções</Link></li>
                    <li><Link to="/user/donations" onClick={closeUserMenu}>Minhas Doações</Link></li>
                    <li><button onClick={() => { closeUserMenu(); logout(); }} className="w-full text-left">Sair</button></li>
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="btn btn-sm btn-primary hover:bg-primary-focus transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-sm btn-secondary hover:bg-secondary-focus transition-colors duration-200"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral text-neutral-content">
        <div className="container mx-auto px-4 py-12">
          <div className="footer">
            <div>
              <div className="flex items-center mb-4">
                <img src={logoImg} alt="Bicho Solto" className="mr-2" style={{ width: '150px', height: '150px' }} />
                <span className="text-lg font-bold">Bicho Solto</span>
              </div>
              <p>Conectando pessoas e animais<br/>Salvando vidas desde 2022</p>
            </div> 
            <div>
              <span className="footer-title">Serviços</span> 
              <Link to="/animals" className="link link-hover">Adoção</Link> 
              <Link to="/report-abuse" className="link link-hover">Denúncias</Link> 
              <Link to="/donate" className="link link-hover">Doações</Link> 
              <Link to="/volunteer" className="link link-hover">Voluntariado</Link>
            </div> 
            <div>
              <span className="footer-title">Institucional</span> 
              <Link to="/about" className="link link-hover">Sobre Nós</Link> 
              <Link to="/contact" className="link link-hover">Contato</Link> 
              <Link to="/partners" className="link link-hover">Parceiros</Link> 
              <Link to="/press" className="link link-hover">Imprensa</Link>
            </div> 
            <div>
              <span className="footer-title">Legal</span> 
              <Link to="/terms" className="link link-hover">Termos de Uso</Link> 
              <Link to="/privacy" className="link link-hover">Política de Privacidade</Link> 
              <Link to="/cookie-policy" className="link link-hover">Política de Cookies</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-8 border-t border-neutral-content/20">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024 Bicho Solto. Todos os direitos reservados.</p>
            </div>
            <div className="flex gap-4">
              <a className="btn btn-circle btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a> 
              <a className="btn btn-circle btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                </svg>
              </a> 
              <a className="btn btn-circle btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
              </a>
              <a className="btn btn-circle btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout