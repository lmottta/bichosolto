const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

// Middleware para validação de erros
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validador de senha
const validatePassword = (password) => {
  // Senha deve ter no mínimo 6 caracteres
  return password && password.length >= 6;
};

// Rota de registro de usuário
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role')
      .isIn(['user', 'ong', 'admin'])
      .withMessage('Tipo de usuário inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log('--- Iniciando Registro ---');
      console.log('Dados recebidos no corpo da requisição:', req.body);
      const { email, password, role } = req.body;

      // Verificar se o email já está em uso
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Validar senha
      if (!validatePassword(password)) {
        return res.status(400).json({
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      // Adicionar campos específicos de acordo com o tipo de usuário
      let userData = { ...req.body };
      console.log('Dados do usuário para criação:', userData);

      // Garantir que só administradores podem criar outros administradores
      if (role === 'admin') {
        const token = req.headers.authorization?.split(' ')[1];
        
        // Se não for um token de admin, rejeitar a criação de admin
        if (!token || !token.startsWith('SimpleAuth_')) {
          return res.status(403).json({ 
            message: 'Você não tem permissão para criar um administrador'
          });
        }
        
        // Extrair id do token SimpleAuth
        const [_, userId] = token.split('_');
        if (!userId) {
          return res.status(403).json({ message: 'Token inválido' });
        }
        
        // Buscar o usuário pelo ID
        const requestingUser = await User.findByPk(userId);
        if (!requestingUser || requestingUser.role !== 'admin') {
          return res.status(403).json({ 
            message: 'Apenas administradores podem criar outros administradores'
          });
        }
      }

      // Criar o usuário
      const user = await User.create(userData);
      console.log('Usuário criado no banco de dados:', user ? user.toJSON() : 'Falha ao criar usuário');

      // Retornar usuário criado (sem a senha)
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        // Incluir campos de ONG se aplicável
        ...(user.role === 'ong' && {
          cnpj: user.cnpj,
          description: user.description,
          foundingDate: user.foundingDate,
          website: user.website,
          socialMedia: user.socialMedia,
          responsibleName: user.responsibleName,
          responsiblePhone: user.responsiblePhone,
          postalCode: user.postalCode,
          isVerified: user.isVerified
        })
      };
      console.log('Objeto userResponse a ser enviado:', userResponse);

      // Criar token SimpleAuth
      const simpleToken = `SimpleAuth_${user.id}_${user.email}`;
      console.log('Token SimpleAuth criado:', simpleToken);

      // Garantir que userResponse e token são válidos antes de enviar
      if (!userResponse || !simpleToken) {
        console.error('ERRO CRÍTICO: userResponse ou simpleToken inválidos antes de enviar resposta.');
        return res.status(500).json({ message: 'Erro interno ao preparar resposta de registro.' });
      }

      res.status(201).json({ 
        message: 'Usuário registrado com sucesso',
        user: userResponse,
        token: simpleToken
      });
      console.log('--- Registro Concluído com Sucesso ---');
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  }
);

// Rota de login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log('--- Iniciando Login ---');
      console.log('Dados recebidos no corpo da requisição:', req.body);
      const { email, password } = req.body;

      // Buscar usuário pelo email
      const user = await User.findOne({ where: { email } });
      console.log('Usuário encontrado no banco:', user ? user.toJSON() : 'Usuário não encontrado');
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // Verificar senha
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // Verificar se o usuário está ativo
      if (!user.isActive) {
        return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
      }

      // Criar token SimpleAuth
      const simpleToken = `SimpleAuth_${user.id}_${user.email}`;

      // Retornar usuário e token (sem a senha)
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        // Incluir campos de ONG se aplicável
        ...(user.role === 'ong' && {
          cnpj: user.cnpj,
          description: user.description,
          foundingDate: user.foundingDate,
          website: user.website,
          socialMedia: user.socialMedia,
          responsibleName: user.responsibleName,
          responsiblePhone: user.responsiblePhone,
          postalCode: user.postalCode,
          isVerified: user.isVerified
        })
      };
      console.log('Objeto userResponse a ser enviado:', userResponse);

      // Garantir que userResponse e token são válidos antes de enviar
      if (!userResponse || !simpleToken) {
        console.error('ERRO CRÍTICO: userResponse ou simpleToken inválidos antes de enviar resposta.');
        return res.status(500).json({ message: 'Erro interno ao preparar resposta de login.' });
      }

      res.json({ user: userResponse, token: simpleToken });
      console.log('--- Login Concluído com Sucesso ---');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ message: 'Erro ao fazer login' });
    }
  }
);

// Exportar o router
module.exports = router;