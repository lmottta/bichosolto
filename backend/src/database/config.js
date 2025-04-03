const { Sequelize } = require('sequelize');
require('dotenv').config();

// Função para determinar se estamos no ambiente Railway
const isRailway = () => {
  return process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_NAME;
};

// Configuração do Sequelize para conexão com o PostgreSQL
let sequelizeConfig;

// Usar DATABASE_URL se disponível (formato Railway)
if (process.env.DATABASE_URL) {
  sequelizeConfig = {
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: false,
    },
  };
} else {
  // Configuração com parâmetros separados
  sequelizeConfig = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: false,
    },
  };
}

console.log('Configuração do banco de dados:', {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'usando DATABASE_URL',
  database: process.env.DB_NAME || 'usando DATABASE_URL',
  ssl: process.env.NODE_ENV === 'production' ? 'habilitado' : 'desabilitado'
});

const sequelize = new Sequelize(sequelizeConfig);

module.exports = { sequelize, Sequelize };