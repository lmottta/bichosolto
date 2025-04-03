const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware para validação de erros
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Rota de registro
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role').isIn(['user', 'ong']).withMessage('Tipo de usuário inválido'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório'),
    // Validações condicionais para campos de ONG
    body('cnpj')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('CNPJ é obrigatório para ONGs')
      .isLength({ min: 14, max: 18 }).withMessage('CNPJ inválido'),
    body('description')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Descrição é obrigatória para ONGs'),
    body('responsibleName')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Nome do responsável é obrigatório para ONGs'),
    body('responsiblePhone')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Telefone do responsável é obrigatório para ONGs'),
    body('address')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Endereço é obrigatório para ONGs'),
    body('city')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Cidade é obrigatória para ONGs'),
    body('state')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('Estado é obrigatório para ONGs'),
    body('postalCode')
      .if(body('role').equals('ong'))
      .notEmpty().withMessage('CEP é obrigatório para ONGs')
      .matches(/^\d{5}-?\d{3}$/).withMessage('CEP inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { 
        name, email, password, role, phone, address, city, state,
        // Campos específicos para ONG
        cnpj, description, foundingDate, website, socialMedia,
        responsibleName, responsiblePhone, postalCode
      } = req.body;

      // Verificar se o email já está em uso
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }

      // Verificar se o CNPJ já está em uso (para ONGs)
      if (role === 'ong' && cnpj) {
        const existingOng = await User.findOne({ where: { cnpj } });
        if (existingOng) {
          return res.status(400).json({ message: 'Este CNPJ já está cadastrado' });
        }
      }

      // Criar novo usuário
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'user',
        phone,
        address,
        city,
        state,
        // Campos específicos para ONG
        ...(role === 'ong' && {
          cnpj,
          description,
          foundingDate: foundingDate ? new Date(foundingDate) : null,
          website,
          socialMedia,
          responsibleName,
          responsiblePhone,
          postalCode,
          isVerified: false // ONGs precisam ser verificadas
        })
      });

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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

      res.status(201).json({ 
        user: userResponse, 
        token,
        message: role === 'ong' 
          ? 'Cadastro realizado com sucesso! Sua conta será analisada antes de ser ativada.'
          : 'Cadastro realizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      
      // Melhorar a resposta com detalhes do erro para facilitar o diagnóstico
      let errorMessage = 'Erro ao registrar usuário';
      let errorDetails = null;
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        errorMessage = `O ${field} fornecido já está em uso`;
      } else if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Erro de validação: ' + error.errors.map(err => err.message).join(', ');
      } else if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
        errorMessage = 'Erro de conexão com o banco de dados';
        errorDetails = {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          message: error.message
        };
      }
      
      console.error('Detalhes do erro:', {
        errorName: error.name,
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: errorDetails
      });
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
      const { email, password } = req.body;

      // Buscar usuário pelo email
      const user = await User.findOne({ where: { email } });
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

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
      };

      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ message: 'Erro ao fazer login' });
    }
  }
);

module.exports = router;