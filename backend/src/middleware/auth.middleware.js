const { User } = require('../models');

// Middleware para verificar autenticação
const authenticate = async (req, res, next) => {
  try {
    // Verificar se é uma requisição pública marcada
    if (req.headers['x-public-request'] === 'true') {
      // Para requisições públicas, continuamos sem autenticar
      req.isPublicRequest = true;
      return next();
    }
    
    // Verificar se o token está presente no cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
    }

    // Extrair o token do cabeçalho
    const token = authHeader.split(' ')[1];

    // Verificar o formato do token simplificado (SimpleAuth_id_email)
    if (!token.startsWith('SimpleAuth_')) {
      return res.status(401).json({ message: 'Formato de token inválido.' });
    }
    
    // Extrair id e email do token
    const parts = token.split('_');
    if (parts.length !== 3) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    const userId = parts[1];
    const email = parts[2];
    
    if (!userId || !email) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    // Buscar o usuário no banco de dados
    const user = await User.findOne({ 
      where: { 
        id: userId,
        email: email 
      } 
    });
    
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

    return next();
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