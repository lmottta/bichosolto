import express from 'express';
import {
    registerUser, // Supondo que existe
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
     // ... importar outras funções ...
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Importar o middleware protect
import upload from '../middleware/multerConfig.js'; // Importar a config do Multer

const router = express.Router();

// Rota de registro (pública)
router.post('/register', registerUser); // Supondo que existe

// Rota de login (pública)
router.post('/login', loginUser);

// Rota para buscar perfil do usuário logado (protegida)
router.get('/me', protect, getUserProfile);

// Rota para atualizar perfil (protegida)
// Usar upload.single('profileImage') se o campo no form-data for 'profileImage'
router.put('/me', protect, upload.single('profileImage'), updateUserProfile);

// Rota para atualizar senha (protegida)
router.put('/me/password', protect, updateUserPassword);

// ... outras rotas de usuário ...

export default router; 