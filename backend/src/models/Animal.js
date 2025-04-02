const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Animal = sequelize.define('Animal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  breed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ageUnit: {
    type: DataTypes.ENUM('days', 'months', 'years'),
    defaultValue: 'months',
    allowNull: false,
    field: 'age_unit',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'unknown'),
    allowNull: false,
  },
  size: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'extra_large'),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  healthStatus: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'health_status',
  },
  isVaccinated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_vaccinated',
  },
  isNeutered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_neutered',
  },
  isSpecialNeeds: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_special_needs',
  },
  specialNeedsDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_needs_description',
  },
  adoptionStatus: {
    type: DataTypes.ENUM('available', 'pending', 'adopted'),
    defaultValue: 'available',
    allowNull: false,
    field: 'adoption_status',
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  adoptedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'adopted_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  adoptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'adopted_at',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Animal;