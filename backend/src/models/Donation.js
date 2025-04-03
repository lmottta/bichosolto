const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Donation = sequelize.define('Donation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('financial', 'item'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Obrigatório apenas para doações financeiras
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'BRL',
    allowNull: true, // Obrigatório apenas para doações financeiras
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: true, // Obrigatório apenas para doações de itens
  },
  itemDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  itemQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true, // Obrigatório apenas para doações de itens
  },
  itemCategory: {
    type: DataTypes.ENUM('food', 'medicine', 'toys', 'accessories', 'cleaning', 'other'),
    allowNull: true, // Obrigatório apenas para doações de itens
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true, // Obrigatório apenas para doações financeiras
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  donorId: {
    type: DataTypes.UUID,
    allowNull: true, // Pode ser anônimo
    references: {
      model: 'users',
      key: 'id',
    },
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false, // ONG ou administrador que recebe a doação
    references: {
      model: 'users',
      key: 'id',
    },
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true, // Pode estar associado a uma campanha específica
    references: {
      model: 'events',
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    allowNull: true, // Para doações de itens que precisam ser coletados
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  receiptImage: {
    type: DataTypes.STRING,
    allowNull: true, // Comprovante de doação
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

module.exports = Donation;