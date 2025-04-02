const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate, isAdmin, isOwner } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
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

// Rota para obter o perfil do usuário logado
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// Rota para atualizar o perfil do usuário
router.put(
  '/me',
  authenticate,
  upload.single('profileImage'),
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('phone').optional(),
    body('address').optional(),
    body('city').optional(),
    body('state').optional(),
    body('bio').optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, phone, address, city, state, bio } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Atualizar campos
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (bio !== undefined) user.bio = bio;
      
      // Se uma imagem foi enviada, atualizar o caminho
      if (req.file) {
        user.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      await user.save();

      // Retornar usuário atualizado (sem a senha)
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        bio: user.bio,
        profileImage: user.profileImage,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json(userResponse);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
  }
);

// Rota para atualizar a imagem de perfil
router.post(
  '/me/profile-image',
  authenticate,
  upload.single('profileImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Atualizar caminho da imagem de perfil
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
      await user.save();

      res.json({
        message: 'Imagem de perfil atualizada com sucesso',
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error('Erro ao atualizar imagem de perfil:', error);
      res.status(500).json({ message: 'Erro ao atualizar imagem de perfil' });
    }
  }
);

// Rota para alterar a senha
router.put(
  '/me/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Verificar senha atual
      const isPasswordValid = await user.checkPassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha atual incorreta' });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ message: 'Erro ao alterar senha' });
    }
  }
);

// Rotas administrativas (apenas para administradores)

// Listar todos os usuários (admin)
router.get('/', authenticate, async (req, res) => {
  try {
    // Se for uma requisição pública, apenas retornar ONGs ativas
    if (req.isPublicRequest) {
      const ongs = await User.findAll({
        where: { 
          role: 'ong',
          isActive: true
        },
        attributes: ['id', 'name', 'role', 'profileImage', 'city', 'state']
      });
      
      return res.json(ongs);
    }
    
    // Para requisições autenticadas com permissão de admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
    
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
});

// Obter usuário por ID (admin)
router.get('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Atualizar status de usuário (ativar/desativar) (admin)
router.patch(
  '/:id/status',
  authenticate,
  isAdmin,
  [
    body('isActive').isBoolean().withMessage('isActive deve ser um booleano'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Não permitir desativar o próprio usuário administrador
      if (req.user.id === user.id && !isActive) {
        return res.status(400).json({ message: 'Não é possível desativar sua própria conta' });
      }

      user.isActive = isActive;
      await user.save();

      res.json({
        message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do usuário' });
    }
  }
);

module.exports = router;