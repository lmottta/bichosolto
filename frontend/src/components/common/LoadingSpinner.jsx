import React from 'react';

/**
 * Componente de Loading Spinner reutilizável
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.fullScreen - Se verdadeiro, o spinner ocupará toda a tela
 * @param {string} props.size - Tamanho do spinner: 'sm', 'md', 'lg' (padrão: 'md')
 * @param {string} props.message - Mensagem opcional a ser exibida abaixo do spinner
 * @param {string} props.className - Classes CSS adicionais
 */
const LoadingSpinner = ({ fullScreen = false, size = 'md', message = '', className = '' }) => {
  // Mapear tamanhos para classes CSS
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Base container classes
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50' 
    : 'flex flex-col items-center justify-center py-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`animate-spin rounded-full border-t-4 border-primary-500 border-opacity-75 border-b-4 border-b-transparent ${sizeClasses[size]}`} role="status">
          <span className="sr-only">Carregando...</span>
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 text-center">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner; 