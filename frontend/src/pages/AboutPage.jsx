const AboutPage = () => {
  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8 text-center">Sobre o Bicho Solto</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Nossa Missão</h2>
        <p className="text-gray-700 mb-4">
          O Bicho Solto é uma plataforma dedicada a facilitar o resgate, cuidado e adoção de animais em situação de vulnerabilidade. 
          Nossa missão é conectar pessoas que desejam ajudar com animais que precisam de assistência, criar uma rede de proteção animal 
          eficiente e promover a conscientização sobre o bem-estar animal.
        </p>
        <p className="text-gray-700">
          Acreditamos que todo animal merece uma vida digna, com saúde, segurança e amor. Trabalhamos diariamente para construir 
          um mundo onde nenhum animal seja abandonado ou maltratado.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Como Funcionamos</h2>
        <p className="text-gray-700 mb-6">
          Nossa plataforma conecta diferentes agentes que atuam na proteção animal:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="bg-primary-100 text-primary-700 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Denúncias</h3>
            <p className="text-gray-600">
              Cidadãos podem reportar casos de animais em situação de risco, maus-tratos ou abandono.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="bg-primary-100 text-primary-700 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">ONGs e Protetores</h3>
            <p className="text-gray-600">
              Organizações e protetores independentes podem registrar animais para adoção e criar campanhas.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="bg-primary-100 text-primary-700 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Adotantes e Apoiadores</h3>
            <p className="text-gray-600">
              Pessoas interessadas podem adotar animais, fazer doações ou se voluntariar em eventos.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Nossa Equipe</h2>
        <p className="text-gray-700 mb-6">
          Somos um time de profissionais e voluntários apaixonados pela causa animal, incluindo veterinários, 
          desenvolvedores, designers e especialistas em proteção animal.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">VG</span>
            </div>
            <div>
              <h3 className="font-bold">Ver. Galeguinho SPA</h3>
              <p className="text-gray-600">Idealizador e financiador</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">LA</span>
            </div>
            <div>
              <h3 className="font-bold">Leonardo A. Mota</h3>
              <p className="text-gray-600">Desenvolvedor</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">AR</span>
            </div>
            <div>
              <h3 className="font-bold">Ana Rodrigues</h3>
              <p className="text-gray-600">Coordenadora de Resgates</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">PM</span>
            </div>
            <div>
              <h3 className="font-bold">Pedro Mendes</h3>
              <p className="text-gray-600">Vaterinário</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 