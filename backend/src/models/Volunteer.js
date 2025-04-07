const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Volunteer = sequelize.define('Volunteer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id',
    },
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true,
  },
  availability: {
    type: DataTypes.ENUM('weekdays', 'weekends', 'evenings', 'full_time', 'on_call'),
    allowNull: false,
  },
  availableHours: {
    type: DataTypes.INTEGER,
    allowNull: true, // Horas disponíveis por semana
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hasVehicle: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  preferredActivities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'active', 'inactive'),
    defaultValue: 'pending',
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true, // Documentos como RG, comprovante de residência, etc.
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Volunteer;