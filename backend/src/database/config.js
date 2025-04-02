const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do Sequelize para conexão com o PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    freezeTableName: false,
  },
});

module.exports = { sequelize, Sequelize };