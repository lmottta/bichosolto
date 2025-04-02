const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  animalType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'animal_type',
  },
  urgencyLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
    allowNull: false,
    field: 'urgency_level',
  },
  status: {
    type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'closed'),
    defaultValue: 'pending',
    allowNull: false,
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at',
  },
});

module.exports = Report;