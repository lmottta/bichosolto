const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Donation, User, Event } = require('../models');
const { authenticate, isOngOrAdmin, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de comprovantes de doação
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/donations'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'receipt-' + uniqueSuffix + ext);
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

// Rota para criar uma nova doação financeira
router.post(
  '/financial',
  authenticate,
  [
    body('amount').isNumeric().withMessage('Valor deve ser numérico'),
    body('currency').optional().isString().withMessage('Moeda inválida'),
    body('paymentMethod').notEmpty().withMessage('Método de pagamento é obrigatório'),
    body('recipientId').isUUID().withMessage('ID do destinatário inválido'),
    body('campaignId').optional().isUUID().withMessage('ID da campanha inválido'),
    body('isAnonymous').optional().isBoolean().withMessage('isAnonymous deve ser um booleano'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        amount, currency, paymentMethod, recipientId, campaignId,
        message, isAnonymous, transactionId
      } = req.body;

      // Verificar se o destinatário existe e é uma ONG
      const recipient = await User.findByPk(recipientId);
      if (!recipient || recipient.role !== 'ong') {
        return res.status(400).json({ message: 'Destinatário inválido' });
      }

      // Verificar se a campanha existe, se fornecida
      if (campaignId) {
        const campaign = await Event.findByPk(campaignId);
        if (!campaign) {
          return res.status(400).json({ message: 'Campanha não encontrada' });
        }
      }

      // Criar a doação
      const donation = await Donation.create({
        type: 'financial',
        amount,
        currency: currency || 'BRL',
        paymentMethod,
        transactionId,
        donorId: isAnonymous ? null : req.user.id,
        recipientId,
        campaignId: campaignId || null,
        message,
        isAnonymous: isAnonymous || false,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Doação registrada com sucesso',
        donation,
        uploadReceiptUrl: `/api/donations/${donation.id}/receipt`
      });
    } catch (error) {
      console.error('Erro ao registrar doação:', error);
      res.status(500).json({ message: 'Erro ao registrar doação' });
    }
  }
);

// Rota para criar uma nova doação de item
router.post(
  '/item',
  authenticate,
  [
    body('itemName').notEmpty().withMessage('Nome do item é obrigatório'),
    body('itemQuantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo'),
    body('itemCategory').isIn(['food', 'medicine', 'toys', 'accessories', 'cleaning', 'other']).withMessage('Categoria inválida'),
    body('recipientId').isUUID().withMessage('ID do destinatário inválido'),
    body('deliveryAddress').optional().notEmpty().withMessage('Endereço de entrega não pode ser vazio'),
    body('isAnonymous').optional().isBoolean().withMessage('isAnonymous deve ser um booleano'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        itemName, itemDescription, itemQuantity, itemCategory,
        recipientId, campaignId, message, isAnonymous, deliveryAddress, deliveryDate
      } = req.body;

      // Verificar se o destinatário existe e é uma ONG
      const recipient = await User.findByPk(recipientId);
      if (!recipient || recipient.role !== 'ong') {
        return res.status(400).json({ message: 'Destinatário inválido' });
      }

      // Verificar se a campanha existe, se fornecida
      if (campaignId) {
        const campaign = await Event.findByPk(campaignId);
        if (!campaign) {
          return res.status(400).json({ message: 'Campanha não encontrada' });
        }
      }

      // Criar a doação
      const donation = await Donation.create({
        type: 'item',
        itemName,
        itemDescription,
        itemQuantity,
        itemCategory,
        donorId: isAnonymous ? null : req.user.id,
        recipientId,
        campaignId: campaignId || null,
        message,
        isAnonymous: isAnonymous || false,
        deliveryAddress,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Doação de item registrada com sucesso',
        donation
      });
    } catch (error) {
      console.error('Erro ao registrar doação de item:', error);
      res.status(500).json({ message: 'Erro ao registrar doação de item' });
    }
  }
);

// Rota para adicionar comprovante de doação
router.post(
  '/:id/receipt',
  authenticate,
  upload.single('receipt'),
  async (req, res) => {
    try {
      const donationId = req.params.id;
      
      // Buscar a doação
      const donation = await Donation.findByPk(donationId);
      if (!donation) {
        return res.status(404).json({ message: 'Doação não encontrada' });
      }

      // Verificar se o usuário é o doador ou um admin
      if (donation.donorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      // Verificar se foi enviado um comprovante
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum comprovante enviado' });
      }

      // Atualizar o caminho do comprovante
      donation.receiptImage = `/uploads/donations/${req.file.filename}`;
      await donation.save();

      res.json({
        message: 'Comprovante adicionado com sucesso',
        receiptImage: donation.receiptImage
      });
    } catch (error) {
      console.error('Erro ao adicionar comprovante:', error);
      res.status(500).json({ message: 'Erro ao adicionar comprovante' });
    }
  }
);

// Rota para listar todas as doações (com filtros)
router.get('/', authenticate, isOngOrAdmin, async (req, res) => {
  try {
    const { type, status, recipientId, campaignId, page = 1, limit = 10 } = req.query;
    
    // Construir o objeto de filtro
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (recipientId) filter.recipientId = recipientId;
    if (campaignId) filter.campaignId = campaignId;

    // Se o usuário for uma ONG, mostrar apenas as doações destinadas a ela
    if (req.user.role === 'ong') {
      filter.recipientId = req.user.id;
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar doações com paginação
    const { count, rows: donations } = await Donation.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Event,
          as: 'campaign',
          attributes: ['id', 'title', 'description'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      donations,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar doações:', error);
    res.status(500).json({ message: 'Erro ao listar doações' });
  }
});

// Rota para obter uma doação específica
router.get('/:id', authenticate, async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Event,
          as: 'campaign',
          attributes: ['id', 'title', 'description'],
        },
      ],
    });

    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' });
    }

    // Verificar permissões
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.id === donation.donorId || 
      req.user.id === donation.recipientId;

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Erro ao buscar doação:', error);
    res.status(500).json({ message: 'Erro ao buscar doação' });
  }
});

// Rota para atualizar o status de uma doação (apenas ONGs e admins)
router.patch(
  '/:id/status',
  authenticate,
  isOngOrAdmin,
  [
    body('status').isIn(['pending', 'confirmed', 'delivered', 'cancelled']).withMessage('Status inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const donationId = req.params.id;
      const { status } = req.body;

      const donation = await Donation.findByPk(donationId);
      if (!donation) {
        return res.status(404).json({ message: 'Doação não encontrada' });
      }

      // Verificar se o usuário é o destinatário ou um admin
      if (donation.recipientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      // Atualizar o status
      donation.status = status;
      await donation.save();

      res.json({
        message: 'Status da doação atualizado com sucesso',
        donation
      });
    } catch (error) {
      console.error('Erro ao atualizar status da doação:', error);
      res.status(500).json({ message: 'Erro ao atualizar status da doação' });
    }
  }
);

// Rota para listar doações feitas pelo usuário logado
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar doações do usuário com paginação
    const { count, rows: donations } = await Donation.findAndCountAll({
      where: { donorId: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Event,
          as: 'campaign',
          attributes: ['id', 'title', 'description'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      donations,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar doações do usuário:', error);
    res.status(500).json({ message: 'Erro ao listar doações do usuário' });
  }
});

// Rota para listar doações recebidas pela ONG logada
router.get('/ong/me', authenticate, isOngOrAdmin, async (req, res) => {
  try {
    const ongId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    // Construir o objeto de filtro
    const filter = { recipientId: ongId };
    if (status) filter.status = status;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar doações recebidas pela ONG com paginação
    const { count, rows: donations } = await Donation.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'donor',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Event,
          as: 'campaign',
          attributes: ['id', 'title', 'description'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      donations,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar doações recebidas:', error);
    res.status(500).json({ message: 'Erro ao listar doações recebidas' });
  }
});

module.exports = router;