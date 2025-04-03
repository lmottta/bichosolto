// Middleware para capturar e tratar erros globalmente na aplicação
const errorHandler = (err, req, res, next) => {
  // Log detalhado do erro no console para debug
  console.error('==================== ERRO NA API ====================');
  console.error(`Rota: ${req.method} ${req.originalUrl}`);
  console.error('Corpo da requisição:', req.body ? { ...req.body, password: req.body.password ? '******' : undefined } : 'Sem corpo');
  console.error('Headers:', req.headers);
  console.error('Erro:', err);
  
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    // Erros de validação do Sequelize
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors
    });
  }
  
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    // Erros de conexão com banco de dados
    return res.status(500).json({
      status: 'error',
      message: 'Erro de conexão com o banco de dados',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno no servidor'
    });
  }
  
  // Erro genérico para produção (oculta detalhes técnicos)
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Erro interno no servidor';
  
  res.status(statusCode).json({
    status: 'error',
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details || err.parent || {} 
    })
  });
};

module.exports = errorHandler; 