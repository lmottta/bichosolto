const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// Remover a dependência do JWT mas mantê-la para não quebrar outros componentes
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
      .notEmpty().withMessage('CNPJ é obrigatório para ONGs'),
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
      .notEmpty().withMessage('CEP é obrigatório para ONGs'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { 
        name, email, password, role, phone, address, city, state,
        // Campos específicos para ONG
        cnpj, description, foundingDate, website, socialMedia,
        responsibleName, responsiblePhone, postalCode
      } = req.body;

      console.log('Dados recebidos para registro:', { ...req.body, password: '******' });

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

      // Preparar dados de usuário
      const userData = {
        name,
        email,
        password,
        role: role || 'user',
        phone
      };
      
      // Adicionar campos comuns se fornecidos
      if (address) userData.address = address;
      if (city) userData.city = city;
      if (state) userData.state = state;
      
      // Adicionar campos específicos para ONG
      if (role === 'ong') {
        if (cnpj) userData.cnpj = cnpj;
        if (description) userData.description = description;
        if (foundingDate) userData.foundingDate = new Date(foundingDate);
        if (website) userData.website = website;
        if (socialMedia) userData.socialMedia = socialMedia;
        if (responsibleName) userData.responsibleName = responsibleName;
        if (responsiblePhone) userData.responsiblePhone = responsiblePhone;
        if (postalCode) userData.postalCode = postalCode;
        userData.isVerified = false; // ONGs precisam ser verificadas
      }

      console.log('Dados formatados para criação do usuário:', { ...userData, password: '******' });

      // Criar novo usuário
      const user = await User.create(userData);

      console.log('Usuário criado com sucesso:', user.id);

      // Gerar um token JWT apenas para manter compatibilidade com clientes existentes
      // Este token não será usado para autenticação pelo novo frontend
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'simplificado',
        { expiresIn: '30d' }
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

      return res.status(201).json({ 
        user: userResponse, 
        token, // mantido para compatibilidade
        message: role === 'ong' 
          ? 'Cadastro realizado com sucesso! Sua conta será analisada antes de ser ativada.'
          : 'Cadastro realizado com sucesso!'
      });
    } catch (error) {
      // Propagar o erro para o middleware de tratamento de erros
      next(error);
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

      // Gerar token JWT apenas para compatibilidade
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'simplificado',
        { expiresIn: '30d' }
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

      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ message: 'Erro ao fazer login' });
    }
  }
);

module.exports = router;