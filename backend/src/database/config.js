const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do Sequelize para conexão com o PostgreSQL
let sequelize;

// Se DATABASE_URL estiver definido (como no Railway), usá-lo
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necessário para algumas configurações do Railway
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: false,
    },
  });
} else {
  // Caso contrário, usar configurações individuais
  sequelize = new Sequelize({
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
}

module.exports = { sequelize, Sequelize };