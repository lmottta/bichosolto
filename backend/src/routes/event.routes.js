const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Event, User, Volunteer } = require('../models');
const { authenticate, isOngOrAdmin, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens de eventos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/events'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
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

// Rota para criar um novo evento (apenas ONGs e admins)
router.post(
  '/',
  authenticate,
  isOngOrAdmin,
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('eventType').isIn(['adoption', 'vaccination', 'neutering', 'fundraising', 'education', 'other']).withMessage('Tipo de evento inválido'),
    body('startDate').isISO8601().withMessage('Data de início inválida'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('address').notEmpty().withMessage('Endereço é obrigatório'),
    body('city').notEmpty().withMessage('Cidade é obrigatória'),
    body('state').notEmpty().withMessage('Estado é obrigatório'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        title, description, eventType, startDate, endDate, location, address,
        city, state, latitude, longitude, contactEmail, contactPhone, maxParticipants
      } = req.body;

      // Criar o evento
      const event = await Event.create({
        title,
        description,
        eventType,
        startDate,
        endDate: endDate || null,
        location,
        address,
        city,
        state,
        latitude,
        longitude,
        contactEmail,
        contactPhone,
        maxParticipants: maxParticipants || null,
        userId: req.user.id,
      });

      res.status(201).json({
        message: 'Evento criado com sucesso',
        event,
        uploadImageUrl: `/api/events/${event.id}/image`
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      res.status(500).json({ message: 'Erro ao criar evento' });
    }
  }
);

// Rota para adicionar imagem a um evento
router.post(
  '/:id/image',
  authenticate,
  isOwner(Event),
  upload.single('image'),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      
      // Buscar o evento
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Verificar se foi enviada uma imagem
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      // Atualizar o caminho da imagem do evento
      event.image = `/uploads/events/${req.file.filename}`;
      await event.save();

      res.json({
        message: 'Imagem adicionada com sucesso',
        image: event.image
      });
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
      res.status(500).json({ message: 'Erro ao adicionar imagem' });
    }
  }
);

// Rota para listar todos os eventos (com filtros)
router.get('/', async (req, res) => {
  try {
    const { eventType, city, state, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Construir o objeto de filtro
    const filter = { isActive: true };
    if (eventType) filter.eventType = eventType;
    if (city) filter.city = city;
    if (state) filter.state = state;
    
    // Filtrar por data
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate['$gte'] = new Date(startDate);
      }
      if (endDate) {
        filter.endDate = filter.endDate || {};
        filter.endDate['$lte'] = new Date(endDate);
      }
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar eventos com paginação
    const { count, rows: events } = await Event.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'ASC']],
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      events,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ message: 'Erro ao listar eventos' });
  }
});

// Rota para obter um evento específico
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro ao buscar evento' });
  }
});

// Rota para atualizar informações de um evento
router.put(
  '/:id',
  authenticate,
  isOwner(Event),
  [
    body('title').optional().notEmpty().withMessage('Título não pode ser vazio'),
    body('description').optional().notEmpty().withMessage('Descrição não pode ser vazia'),
    body('eventType').optional().isIn(['adoption', 'vaccination', 'neutering', 'fundraising', 'education', 'other']).withMessage('Tipo de evento inválido'),
    body('startDate').optional().isISO8601().withMessage('Data de início inválida'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const eventId = req.params.id;
      
      // Buscar o evento
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Campos que podem ser atualizados
      const updatableFields = [
        'title', 'description', 'eventType', 'startDate', 'endDate', 'location',
        'address', 'city', 'state', 'latitude', 'longitude', 'contactEmail',
        'contactPhone', 'maxParticipants', 'isActive'
      ];

      // Atualizar campos
      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });

      await event.save();

      res.json({
        message: 'Evento atualizado com sucesso',
        event
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      res.status(500).json({ message: 'Erro ao atualizar evento' });
    }
  }
);

// Rota para cancelar um evento (desativar)
router.patch(
  '/:id/cancel',
  authenticate,
  isOwner(Event),
  async (req, res) => {
    try {
      const eventId = req.params.id;

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Desativar o evento
      event.isActive = false;
      await event.save();

      res.json({
        message: 'Evento cancelado com sucesso',
        event
      });
    } catch (error) {
      console.error('Erro ao cancelar evento:', error);
      res.status(500).json({ message: 'Erro ao cancelar evento' });
    }
  }
);

// Rota para listar eventos criados pelo usuário logado
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar eventos do usuário com paginação
    const { count, rows: events } = await Event.findAndCountAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'DESC']],
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    res.json({
      events,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar eventos do usuário:', error);
    res.status(500).json({ message: 'Erro ao listar eventos do usuário' });
  }
});

// Rota para voluntários se inscreverem em um evento
router.post(
  '/:id/volunteers',
  authenticate,
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user.id;

      // Verificar se o evento existe
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Verificar se o evento já atingiu o número máximo de participantes
      if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
        return res.status(400).json({ message: 'Evento já atingiu o número máximo de participantes' });
      }

      // Verificar se o usuário já é um voluntário
      let volunteer = await Volunteer.findOne({ where: { userId } });
      
      // Se não for, criar um registro de voluntário
      if (!volunteer) {
        volunteer = await Volunteer.create({
          userId,
          availability: req.body.availability || 'weekends',
          skills: req.body.skills || [],
          status: 'pending',
        });
      }

      // Verificar se o voluntário já está inscrito no evento
      const alreadyRegistered = await event.hasVolunteer(volunteer);
      if (alreadyRegistered) {
        return res.status(400).json({ message: 'Você já está inscrito neste evento' });
      }

      // Adicionar o voluntário ao evento
      await event.addVolunteer(volunteer);

      // Incrementar o número de participantes
      event.currentParticipants += 1;
      await event.save();

      res.json({
        message: 'Inscrição realizada com sucesso',
        event
      });
    } catch (error) {
      console.error('Erro ao inscrever voluntário:', error);
      res.status(500).json({ message: 'Erro ao inscrever voluntário' });
    }
  }
);

// Rota para listar voluntários de um evento (apenas para o organizador)
router.get(
  '/:id/volunteers',
  authenticate,
  isOwner(Event),
  async (req, res) => {
    try {
      const eventId = req.params.id;

      // Verificar se o evento existe
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Buscar voluntários do evento
      const volunteers = await event.getVolunteers({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone'],
          },
        ],
      });

      res.json(volunteers);
    } catch (error) {
      console.error('Erro ao listar voluntários do evento:', error);
      res.status(500).json({ message: 'Erro ao listar voluntários do evento' });
    }
  }
);

module.exports = router;