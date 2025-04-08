const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

let sequelize;

// Configuração para ambiente local
sequelize = new Sequelize(
  process.env.DB_NAME || 'bicho_solto_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: false,
      underscoredAll: false,
      freezeTableName: true,
    }
  }
);

// Exportamos tanto a instância como um objeto com a propriedade sequelize
module.exports = { sequelize, Sequelize };