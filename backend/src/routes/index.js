const express = require('express');
const router = express.Router();

// Importação das rotas
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reportRoutes = require('./report.routes');
const animalRoutes = require('./animal.routes');
const eventRoutes = require('./event.routes');
const donationRoutes = require('./donation.routes');
const volunteerRoutes = require('./volunteer.routes');

// Definição das rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/animals', animalRoutes);
router.use('/events', eventRoutes);
router.use('/donations', donationRoutes);
router.use('/volunteers', volunteerRoutes);

module.exports = router;