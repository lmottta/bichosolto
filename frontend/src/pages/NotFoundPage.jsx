import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-primary-500">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Página não encontrada</h2>
          <p className="mt-2 text-sm text-gray-600">
            Desculpe, não conseguimos encontrar a página que você está procurando.
          </p>
        </div>
        <div className="mt-8">
          <Link to="/" className="custom-btn-primary inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 