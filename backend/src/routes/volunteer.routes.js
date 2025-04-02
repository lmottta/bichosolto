const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Volunteer, User, Event } = require('../models');
const { authenticate, isOngOrAdmin, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de documentos de voluntários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/volunteers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens e PDFs são permitidos (jpeg, jpg, png, pdf)'));
    }
  }
});

// Middleware para validação de erros
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Rota para se cadastrar como voluntário
router.post(
  '/',
  authenticate,
  [
    body('availability').isIn(['weekdays', 'weekends', 'evenings', 'full_time', 'on_call']).withMessage('Disponibilidade inválida'),
    body('skills').optional().isArray().withMessage('Habilidades deve ser um array'),
    body('availableHours').optional().isInt({ min: 1 }).withMessage('Horas disponíveis deve ser um número inteiro positivo'),
    body('hasVehicle').optional().isBoolean().withMessage('hasVehicle deve ser um booleano'),
    body('preferredActivities').optional().isArray().withMessage('Atividades preferidas deve ser um array'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Verificar se o usuário já é um voluntário
      const existingVolunteer = await Volunteer.findOne({ where: { userId } });
      if (existingVolunteer) {
        return res.status(400).json({ message: 'Você já está cadastrado como voluntário' });
      }

      const {
        skills, availability, availableHours, experience, hasVehicle,
        preferredActivities, emergencyContactName, emergencyContactPhone
      } = req.body;

      // Criar o voluntário
      const volunteer = await Volunteer.create({
        userId,
        skills: skills || [],
        availability,
        availableHours,
        experience,
        hasVehicle: hasVehicle || false,
        preferredActivities: preferredActivities || [],
        status: 'pending',
        emergencyContactName,
        emergencyContactPhone,
        documents: [],
        isActive: true
      });

      res.status(201).json({
        message: 'Cadastro de voluntário realizado com sucesso',
        volunteer,
        uploadDocumentsUrl: `/api/volunteers/${volunteer.id}/documents`
      });
    } catch (error) {
      console.error('Erro ao cadastrar voluntário:', error);
      res.status(500).json({ message: 'Erro ao cadastrar voluntário' });
    }
  }
);

// Rota para adicionar documentos ao cadastro de voluntário
router.post(
  '/:id/documents',
  authenticate,
  isOwner(Volunteer),
  upload.array('documents', 5), // Máximo de 5 documentos
  async (req, res) => {
    try {
      const volunteerId = req.params.id;
      
      // Buscar o voluntário
      const volunteer = await Volunteer.findByPk(volunteerId);
      if (!volunteer) {
        return res.status(404).json({ message: 'Voluntário não encontrado' });
      }

      // Verificar se foram enviados documentos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhum documento enviado' });
      }

      // Adicionar os caminhos dos documentos ao array de documentos do voluntário
      const documentPaths = req.files.map(file => `/uploads/volunteers/${file.filename}`);
      volunteer.documents = [...volunteer.documents, ...documentPaths];
      await volunteer.save();

      res.json({
        message: 'Documentos adicionados com sucesso',
        documents: volunteer.documents
      });
    } catch (error) {
      console.error('Erro ao adicionar documentos:', error);
      res.status(500).json({ message: 'Erro ao adicionar documentos' });
    }
  }
);

// Rota para listar todos os voluntários (apenas ONGs e admins)
router.get('/', authenticate, isOngOrAdmin, async (req, res) => {
  try {
    const { status, availability, page = 1, limit = 10 } = req.query;
    
    // Construir o objeto de filtro
    const filter = {};
    if (status) filter.status = status;
    if (availability) filter.availability = availability;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar voluntários com paginação
    const { count, rows: volunteers } = await Volunteer.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'city', 'state'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      volunteers,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar voluntários:', error);
    res.status(500).json({ message: 'Erro ao listar voluntários' });
  }
});

// Rota para obter um voluntário específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'city', 'state'],
        },
      ],
    });

    if (!volunteer) {
      return res.status(404).json({ message: 'Voluntário não encontrado' });
    }

    // Verificar permissões
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'ong' || 
      req.user.id === volunteer.userId;

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    res.json(volunteer);
  } catch (error) {
    console.error('Erro ao buscar voluntário:', error);
    res.status(500).json({ message: 'Erro ao buscar voluntário' });
  }
});

// Rota para atualizar o status de um voluntário (apenas ONGs e admins)
router.patch(
  '/:id/status',
  authenticate,
  isOngOrAdmin,
  [
    body('status').isIn(['pending', 'approved', 'active', 'inactive']).withMessage('Status inválido'),
    body('notes').optional().isString().withMessage('Notas deve ser uma string'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const volunteerId = req.params.id;
      const { status, notes } = req.body;

      const volunteer = await Volunteer.findByPk(volunteerId);
      if (!volunteer) {
        return res.status(404).json({ message: 'Voluntário não encontrado' });
      }

      // Atualizar o status e notas
      volunteer.status = status;
      if (notes !== undefined) volunteer.notes = notes;
      
      // Se o status for 'approved' ou 'active', definir a data de início
      if (status === 'approved' || status === 'active') {
        volunteer.startDate = volunteer.startDate || new Date();
      }
      
      await volunteer.save();

      res.json({
        message: 'Status do voluntário atualizado com sucesso',
        volunteer
      });
    } catch (error) {
      console.error('Erro ao atualizar status do voluntário:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do voluntário' });
    }
  }
);

// Rota para atualizar informações do voluntário
router.put(
  '/:id',
  authenticate,
  isOwner(Volunteer),
  [
    body('availability').optional().isIn(['weekdays', 'weekends', 'evenings', 'full_time', 'on_call']).withMessage('Disponibilidade inválida'),
    body('skills').optional().isArray().withMessage('Habilidades deve ser um array'),
    body('availableHours').optional().isInt({ min: 1 }).withMessage('Horas disponíveis deve ser um número inteiro positivo'),
    body('hasVehicle').optional().isBoolean().withMessage('hasVehicle deve ser um booleano'),
    body('preferredActivities').optional().isArray().withMessage('Atividades preferidas deve ser um array'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const volunteerId = req.params.id;
      
      // Buscar o voluntário
      const volunteer = await Volunteer.findByPk(volunteerId);
      if (!volunteer) {
        return res.status(404).json({ message: 'Voluntário não encontrado' });
      }

      // Campos que podem ser atualizados
      const updatableFields = [
        'skills', 'availability', 'availableHours', 'experience', 'hasVehicle',
        'preferredActivities', 'emergencyContactName', 'emergencyContactPhone'
      ];

      // Atualizar campos
      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          volunteer[field] = req.body[field];
        }
      });

      await volunteer.save();

      res.json({
        message: 'Informações do voluntário atualizadas com sucesso',
        volunteer
      });
    } catch (error) {
      console.error('Erro ao atualizar voluntário:', error);
      res.status(500).json({ message: 'Erro ao atualizar voluntário' });
    }
  }
);

// Rota para desativar o cadastro de voluntário
router.patch(
  '/:id/deactivate',
  authenticate,
  isOwner(Volunteer),
  async (req, res) => {
    try {
      const volunteerId = req.params.id;

      const volunteer = await Volunteer.findByPk(volunteerId);
      if (!volunteer) {
        return res.status(404).json({ message: 'Voluntário não encontrado' });
      }

      // Desativar o voluntário
      volunteer.isActive = false;
      volunteer.status = 'inactive';
      await volunteer.save();

      res.json({
        message: 'Cadastro de voluntário desativado com sucesso',
        volunteer
      });
    } catch (error) {
      console.error('Erro ao desativar voluntário:', error);
      res.status(500).json({ message: 'Erro ao desativar voluntário' });
    }
  }
);

// Rota para obter o perfil de voluntário do usuário logado
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const volunteer = await Volunteer.findOne({
      where: { userId },
      include: [
        {
          model: Event,
          as: 'events',
          through: { attributes: [] },
          attributes: ['id', 'title', 'description', 'startDate', 'location'],
        },
      ],
    });

    if (!volunteer) {
      return res.status(404).json({ message: 'Perfil de voluntário não encontrado' });
    }

    res.json(volunteer);
  } catch (error) {
    console.error('Erro ao buscar perfil de voluntário:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil de voluntário' });
  }
});

module.exports = router;