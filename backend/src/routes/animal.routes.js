const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Animal, User } = require('../models');
const { authenticate, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens de animais
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/animals'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'animal-' + uniqueSuffix + ext);
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

// Rota para criar um novo animal para adoção
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('type').notEmpty().withMessage('Tipo de animal é obrigatório'),
    body('gender').isIn(['male', 'female', 'unknown']).withMessage('Gênero inválido'),
    body('size').isIn(['small', 'medium', 'large', 'extra_large']).withMessage('Tamanho inválido'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('city').notEmpty().withMessage('Cidade é obrigatória'),
    body('state').notEmpty().withMessage('Estado é obrigatório'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        name, type, breed, age, ageUnit, gender, size, color,
        description, healthStatus, isVaccinated, isNeutered, isSpecialNeeds,
        specialNeedsDescription, location, city, state
      } = req.body;

      // Criar o animal
      const animal = await Animal.create({
        name,
        type,
        breed,
        age: age || null,
        ageUnit: ageUnit || 'months',
        gender,
        size,
        color,
        description,
        healthStatus,
        isVaccinated: isVaccinated === true,
        isNeutered: isNeutered === true,
        isSpecialNeeds: isSpecialNeeds === true,
        specialNeedsDescription,
        location,
        city,
        state,
        userId: req.user.id,
        images: [], // Inicialmente sem imagens
      });

      res.status(201).json({
        message: 'Animal cadastrado com sucesso',
        animal,
        uploadImagesUrl: `/api/animals/${animal.id}/images`
      });
    } catch (error) {
      console.error('Erro ao cadastrar animal:', error);
      res.status(500).json({ message: 'Erro ao cadastrar animal' });
    }
  }
);

// Rota para adicionar imagens a um animal
router.post(
  '/:id/images',
  authenticate,
  isOwner(Animal),
  upload.array('images', 5), // Máximo de 5 imagens
  async (req, res) => {
    try {
      const animalId = req.params.id;
      
      // Buscar o animal
      const animal = await Animal.findByPk(animalId);
      if (!animal) {
        return res.status(404).json({ message: 'Animal não encontrado' });
      }

      // Verificar se foram enviadas imagens
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      // Adicionar os caminhos das imagens ao array de imagens do animal
      const imagePaths = req.files.map(file => `/uploads/animals/${file.filename}`);
      animal.images = [...animal.images, ...imagePaths];
      await animal.save();

      res.json({
        message: 'Imagens adicionadas com sucesso',
        images: animal.images
      });
    } catch (error) {
      console.error('Erro ao adicionar imagens:', error);
      res.status(500).json({ message: 'Erro ao adicionar imagens' });
    }
  }
);

// Rota para listar todos os animais disponíveis para adoção (com filtros)
router.get('/', async (req, res) => {
  try {
    const { type, size, gender, city, state, page = 1, limit = 10 } = req.query;
    
    // Construir o objeto de filtro
    const filter = { adoptionStatus: 'available' };
    if (type) filter.type = type;
    if (size) filter.size = size;
    if (gender) filter.gender = gender;
    if (city) filter.city = city;
    if (state) filter.state = state;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar animais com paginação
    const { count, rows: animals } = await Animal.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'city', 'state'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      animals,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar animais:', error);
    res.status(500).json({ message: 'Erro ao listar animais' });
  }
});

// Rota para obter um animal específico
router.get('/:id', async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'city', 'state'],
        },
        {
          model: User,
          as: 'adopter',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!animal) {
      return res.status(404).json({ message: 'Animal não encontrado' });
    }

    res.json(animal);
  } catch (error) {
    console.error('Erro ao buscar animal:', error);
    res.status(500).json({ message: 'Erro ao buscar animal' });
  }
});

// Rota para atualizar informações de um animal
router.put(
  '/:id',
  authenticate,
  isOwner(Animal),
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('description').optional().notEmpty().withMessage('Descrição não pode ser vazia'),
    body('gender').optional().isIn(['male', 'female', 'unknown']).withMessage('Gênero inválido'),
    body('size').optional().isIn(['small', 'medium', 'large', 'extra_large']).withMessage('Tamanho inválido'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const animalId = req.params.id;
      
      // Buscar o animal
      const animal = await Animal.findByPk(animalId);
      if (!animal) {
        return res.status(404).json({ message: 'Animal não encontrado' });
      }

      // Campos que podem ser atualizados
      const updatableFields = [
        'name', 'breed', 'age', 'ageUnit', 'gender', 'size', 'color',
        'description', 'healthStatus', 'isVaccinated', 'isNeutered', 'isSpecialNeeds',
        'specialNeedsDescription', 'location', 'city', 'state'
      ];

      // Atualizar campos
      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          animal[field] = req.body[field];
        }
      });

      await animal.save();

      res.json({
        message: 'Animal atualizado com sucesso',
        animal
      });
    } catch (error) {
      console.error('Erro ao atualizar animal:', error);
      res.status(500).json({ message: 'Erro ao atualizar animal' });
    }
  }
);

// Rota para atualizar o status de adoção de um animal
router.patch(
  '/:id/adoption-status',
  authenticate,
  isOwner(Animal),
  [
    body('adoptionStatus').isIn(['available', 'pending', 'adopted']).withMessage('Status de adoção inválido'),
    body('adoptedBy').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { adoptionStatus, adoptedBy } = req.body;
      const animalId = req.params.id;

      const animal = await Animal.findByPk(animalId);
      if (!animal) {
        return res.status(404).json({ message: 'Animal não encontrado' });
      }

      // Atualizar status
      animal.adoptionStatus = adoptionStatus;
      
      // Se estiver marcando como adotado, registrar quem adotou e a data
      if (adoptionStatus === 'adopted') {
        if (!adoptedBy) {
          return res.status(400).json({ message: 'ID do adotante é obrigatório para status "adopted"' });
        }
        
        // Verificar se o adotante existe
        const adopter = await User.findByPk(adoptedBy);
        if (!adopter) {
          return res.status(404).json({ message: 'Adotante não encontrado' });
        }
        
        animal.adoptedBy = adoptedBy;
        animal.adoptedAt = new Date();
      } else if (adoptionStatus === 'available') {
        // Se estiver voltando para disponível, limpar informações de adoção
        animal.adoptedBy = null;
        animal.adoptedAt = null;
      }

      await animal.save();

      res.json({
        message: 'Status de adoção atualizado com sucesso',
        animal
      });
    } catch (error) {
      console.error('Erro ao atualizar status de adoção:', error);
      res.status(500).json({ message: 'Erro ao atualizar status de adoção' });
    }
  }
);

// Rota para listar animais cadastrados pelo usuário logado
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar animais do usuário com paginação
    const { count, rows: animals } = await Animal.findAndCountAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      animals,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar animais do usuário:', error);
    res.status(500).json({ message: 'Erro ao listar animais do usuário' });
  }
});

// Rota para listar animais adotados pelo usuário logado
router.get('/adopted/me', authenticate, async (req, res) => {
  try {
    const adoptedBy = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar animais adotados pelo usuário com paginação
    const { count, rows: animals } = await Animal.findAndCountAll({
      where: { adoptedBy },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['adoptedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      animals,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar animais adotados:', error);
    res.status(500).json({ message: 'Erro ao listar animais adotados' });
  }
});

module.exports = router;