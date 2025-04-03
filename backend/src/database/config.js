const { Sequelize } = require('sequelize');
require('dotenv').config();

// Função para determinar se estamos no ambiente Railway
const isRailway = () => {
  return process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_NAME;
};

// Função para obter configuração de conexão
const getConnectionConfig = () => {
  // Se estamos em ambiente Railway e temos DATABASE_URL, usar isso de preferência
  if (isRailway() && process.env.DATABASE_URL) {
    console.log('INFO: Usando DATABASE_URL fornecido pelo Railway');
    return {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    };
  }
  
  // Se DATABASE_URL existir em qualquer ambiente, usar
  if (process.env.DATABASE_URL) {
    console.log('INFO: Usando DATABASE_URL genérico');
    return {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    };
  }
  
  // Caso contrário, usar configuração por parâmetros separados
  console.log('INFO: Usando configuração de conexão por parâmetros separados');
  console.log(`DB_HOST: ${process.env.DB_HOST}, DB_PORT: ${process.env.DB_PORT}, DB_NAME: ${process.env.DB_NAME}`);
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bicho_solto_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  };
};

// Obter a configuração de conexão
const connectionConfig = getConnectionConfig();

// Configuração do Sequelize
const sequelizeConfig = {
  ...connectionConfig,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    freezeTableName: false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Criar instância do Sequelize
const sequelize = connectionConfig.url 
  ? new Sequelize(connectionConfig.url, sequelizeConfig) 
  : new Sequelize(sequelizeConfig);

console.log('Configuração do banco de dados inicializada');

module.exports = { sequelize, Sequelize };