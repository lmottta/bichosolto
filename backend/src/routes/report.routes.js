const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Report, User } = require('../models');
const { authenticate, isOngOrAdmin, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens de denúncias
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/reports'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'report-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)'));
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

// Rota para criar uma nova denúncia
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('animalType').notEmpty().withMessage('Tipo de animal é obrigatório'),
    body('urgencyLevel').isIn(['low', 'medium', 'high', 'critical']).withMessage('Nível de urgência inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { title, description, location, animalType, urgencyLevel, latitude, longitude } = req.body;

      // Verificar se o usuário está autenticado
      let userId = null;
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (error) {
          // Se o token for inválido, a denúncia será anônima
          console.log('Token inválido, denúncia será anônima');
        }
      }

      // Criar a denúncia
      const report = await Report.create({
        title,
        description,
        location,
        animalType,
        urgencyLevel,
        latitude,
        longitude,
        userId,
        images: [], // Inicialmente sem imagens
      });

      res.status(201).json({
        message: 'Denúncia registrada com sucesso',
        report,
        uploadImagesUrl: `/api/reports/${report.id}/images`
      });
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      res.status(500).json({ message: 'Erro ao criar denúncia' });
    }
  }
);

// Rota para adicionar imagens a uma denúncia
router.post(
  '/:id/images',
  upload.array('images', 5), // Máximo de 5 imagens
  async (req, res) => {
    try {
      const reportId = req.params.id;
      
      // Buscar a denúncia
      const report = await Report.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Denúncia não encontrada' });
      }

      // Verificar se foram enviadas imagens
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      // Adicionar os caminhos das imagens ao array de imagens da denúncia
      const imagePaths = req.files.map(file => `/uploads/reports/${file.filename}`);
      report.images = [...report.images, ...imagePaths];
      await report.save();

      res.json({
        message: 'Imagens adicionadas com sucesso',
        images: report.images
      });
    } catch (error) {
      console.error('Erro ao adicionar imagens:', error);
      res.status(500).json({ message: 'Erro ao adicionar imagens' });
    }
  }
);

// Rota para listar todas as denúncias (com filtros)
router.get('/', async (req, res) => {
  try {
    const { status, urgencyLevel, animalType, page = 1, limit = 10 } = req.query;
    
    // Construir o objeto de filtro
    const filter = {};
    if (status) filter.status = status;
    if (urgencyLevel) filter.urgencyLevel = urgencyLevel;
    if (animalType) filter.animalType = animalType;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar denúncias com paginação
    const { count, rows: reports } = await Report.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      reports,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ message: 'Erro ao listar denúncias' });
  }
});

// Rota para obter uma denúncia específica
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }

    res.json(report);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    res.status(500).json({ message: 'Erro ao buscar denúncia' });
  }
});

// Rota para atualizar o status de uma denúncia (apenas ONGs e admins)
router.patch(
  '/:id/status',
  authenticate,
  isOngOrAdmin,
  [
    body('status').isIn(['pending', 'investigating', 'resolved', 'closed']).withMessage('Status inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { status } = req.body;
      const reportId = req.params.id;

      const report = await Report.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Denúncia não encontrada' });
      }

      // Atualizar status
      report.status = status;
      
      // Se estiver marcando como resolvido, registrar a data
      if (status === 'resolved') {
        report.resolvedAt = new Date();
      }

      // Se não estiver atribuído a ninguém, atribuir ao usuário atual
      if (!report.assignedToId) {
        report.assignedToId = req.user.id;
      }

      await report.save();

      res.json({
        message: 'Status da denúncia atualizado com sucesso',
        report
      });
    } catch (error) {
      console.error('Erro ao atualizar status da denúncia:', error);
      res.status(500).json({ message: 'Erro ao atualizar status da denúncia' });
    }
  }
);

// Rota para atribuir uma denúncia a um usuário (apenas ONGs e admins)
router.patch(
  '/:id/assign',
  authenticate,
  isOngOrAdmin,
  [
    body('assignedToId').notEmpty().withMessage('ID do responsável é obrigatório'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { assignedToId } = req.body;
      const reportId = req.params.id;

      // Verificar se a denúncia existe
      const report = await Report.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Denúncia não encontrada' });
      }

      // Verificar se o usuário atribuído existe e é uma ONG ou admin
      const assignedUser = await User.findByPk(assignedToId);
      if (!assignedUser) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (assignedUser.role !== 'ong' && assignedUser.role !== 'admin') {
        return res.status(400).json({ message: 'Apenas ONGs e administradores podem ser responsáveis por denúncias' });
      }

      // Atualizar o responsável pela denúncia
      report.assignedToId = assignedToId;
      await report.save();

      res.json({
        message: 'Denúncia atribuída com sucesso',
        report
      });
    } catch (error) {
      console.error('Erro ao atribuir denúncia:', error);
      res.status(500).json({ message: 'Erro ao atribuir denúncia' });
    }
  }
);

// Rota para listar denúncias do usuário logado
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar denúncias do usuário com paginação
    const { count, rows: reports } = await Report.findAndCountAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      reports,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar denúncias do usuário:', error);
    res.status(500).json({ message: 'Erro ao listar denúncias do usuário' });
  }
});

// Rota para listar denúncias atribuídas ao usuário logado (ONGs e admins)
router.get('/assigned/me', authenticate, isOngOrAdmin, async (req, res) => {
  try {
    const assignedToId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar denúncias atribuídas ao usuário com paginação
    const { count, rows: reports } = await Report.findAndCountAll({
      where: { assignedToId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      reports,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar denúncias atribuídas:', error);
    res.status(500).json({ message: 'Erro ao listar denúncias atribuídas' });
  }
});

module.exports = router;