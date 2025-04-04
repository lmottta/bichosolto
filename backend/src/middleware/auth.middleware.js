const { User } = require('../models');

// Middleware para verificar autenticação com sessão simples
const authenticate = async (req, res, next) => {
  try {
    // Verificar se é uma requisição pública marcada
    if (req.headers['x-public-request'] === 'true') {
      // Para requisições públicas, continuamos sem autenticar
      req.isPublicRequest = true;
      return next();
    }
    
    // Verificar se o ID do usuário está presente no cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Acesso não autorizado. Credenciais não fornecidas.' });
    }

    // Extrair o ID do usuário do cabeçalho
    const userId = authHeader;

    // Buscar o usuário no banco de dados
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Adicionar o usuário ao objeto de requisição
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Middleware para verificar permissões de administrador
const isAdmin = (req, res, next) => {
  // Bloquear requisições públicas em endpoints administrativos
  if (req.isPublicRequest) {
    return res.status(403).json({ message: 'Acesso negado para requisições públicas.' });
  }
  
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
};

// Middleware para verificar permissões de ONG ou administrador
const isOngOrAdmin = (req, res, next) => {
  // Bloquear requisições públicas em endpoints protegidos
  if (req.isPublicRequest) {
    return res.status(403).json({ message: 'Acesso negado para requisições públicas.' });
  }
  
  if (req.user && (req.user.role === 'ong' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão de ONG ou administrador necessária.' });
  }
};

// Middleware para verificar se o usuário é o proprietário do recurso
const isOwner = (model) => async (req, res, next) => {
  // Bloquear requisições públicas para recursos privados
  if (req.isPublicRequest) {
    return res.status(403).json({ message: 'Acesso negado para requisições públicas.' });
  }
  
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const resource = await model.findByPk(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Recurso não encontrado.' });
    }

    if (resource.userId === userId || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado. Você não é o proprietário deste recurso.' });
    }
  } catch (error) {
    console.error('Erro ao verificar propriedade:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isOngOrAdmin,
  isOwner
};