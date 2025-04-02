import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import wallpaperImg from '../img/wallpaper.png'
import logoImg from '../img/logo.png'

const HomePage = () => {
  const { isAuthenticated } = useAuth()
  const [scrollPosition, setScrollPosition] = useState(0)

  // Efeito parallax ao rolar a página
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-[80vh] relative" style={{ backgroundImage: `url(${wallpaperImg})` }}>
        {/* Overlay com gradiente suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/50 backdrop-brightness-90"></div>
        <div className="hero-content text-center text-neutral-content relative z-10">
          <div className="max-w-3xl">
            <h1 className="mb-5 text-5xl font-bold drop-shadow-text">Bicho Solto: Ajudando Nossos Amiguinhos</h1>
            <p className="mb-8 text-xl drop-shadow-text">O Bicho Solto conecta pessoas que amam animais com aqueles que precisam de ajuda. Denuncie maus-tratos, adote um amigo, doe ou voluntarie-se para fazer a diferença.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/report-abuse" className="btn btn-accent btn-lg">Denunciar Maus-tratos</Link>
              <Link to="/animals" className="btn btn-primary btn-lg">Adotar um Animal</Link>
              <Link to="/donate" className="btn btn-secondary btn-lg">Fazer uma Doação</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Como Podemos Ajudar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-2xl">Denúncias de Maus-tratos</h3>
                <p>Reporte casos de animais em situação de risco. Sua denúncia pode salvar vidas e será tratada com prioridade.</p>
                <div className="card-actions justify-center mt-4">
                  <Link to="/report-abuse" className="btn btn-primary">
                    Denunciar
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-2xl">Adoção Responsável</h3>
                <p>Encontre um novo amigo para sua família. Temos diversos animais esperando por um lar amoroso e responsável.</p>
                <div className="card-actions justify-center mt-4">
                  <Link to="/animals" className="btn btn-secondary">
                    Adotar
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-2xl">Doações e Financiamento</h3>
                <p>Contribua financeiramente para resgates, tratamentos veterinários e manutenção de abrigos temporários.</p>
                <div className="card-actions justify-center mt-4">
                  <Link to="/donate" className="btn btn-accent">
                    Doar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Feature 4 */}
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-2xl">Voluntariado</h3>
                <p>Ofereça seu tempo e habilidades. Precisamos de voluntários para resgates, transporte, lar temporário e muito mais.</p>
                <div className="card-actions justify-center mt-4">
                  <Link to="/volunteer" className="btn btn-info">
                    Voluntariar
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-2xl">Eventos e Feiras</h3>
                <p>Participe de eventos, feiras de adoção, campanhas de vacinação e ações educativas sobre bem-estar animal.</p>
                <div className="card-actions justify-center mt-4">
                  <Link to="/events" className="btn btn-warning">
                    Ver Eventos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nosso Impacto</h2>
          
          <div className="stats shadow w-full">
            <div className="stat place-items-center">
              <div className="stat-title">Animais Resgatados</div>
              <div className="stat-value text-primary">1.200+</div>
              <div className="stat-desc">Desde 2022</div>
            </div>
            
            <div className="stat place-items-center">
              <div className="stat-title">Adoções Realizadas</div>
              <div className="stat-value text-secondary">850+</div>
              <div className="stat-desc">Famílias formadas</div>
            </div>
            
            <div className="stat place-items-center">
              <div className="stat-title">Denúncias Atendidas</div>
              <div className="stat-value text-accent">3.400+</div>
              <div className="stat-desc">Vidas salvas</div>
            </div>
            
            <div className="stat place-items-center">
              <div className="stat-title">Voluntários Ativos</div>
              <div className="stat-value text-info">500+</div>
              <div className="stat-desc">Heróis anônimos</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-content relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-15" 
          style={{
            backgroundImage: `url(${wallpaperImg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: `translateY(${scrollPosition * 0.2}px)`,
          }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Junte-se a Nós Nessa Causa</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Cada pequena ação faz diferença na vida de um animal. Seja parte dessa rede de proteção e amor aos animais.
          </p>
          {isAuthenticated ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/profile" className="btn btn-secondary btn-lg">
                Acessar Meu Perfil
              </Link>
              <Link to="/report-abuse" className="btn btn-accent btn-lg">
                Fazer uma Denúncia
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn btn-secondary btn-lg">
                Cadastre-se Agora
              </Link>
              <Link to="/login" className="btn btn-accent btn-lg">
                Entrar
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage