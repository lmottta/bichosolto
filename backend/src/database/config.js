const { Sequelize } = require('sequelize');
require('dotenv').config();

// Log das variáveis de ambiente do banco de dados
console.log('--- Configuração do Banco de Dados ---');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PASSWORD presente: ${!!process.env.DB_PASSWORD}`); // Não logar a senha real
console.log(`DATABASE_URL presente: ${!!process.env.DATABASE_URL}`);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('------------------------------------');

// Configuração do Sequelize para conexão com o PostgreSQL
// Idealmente, usar DATABASE_URL se disponível no Railway
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false // Ajuste SSL para produção
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true,
        freezeTableName: false,
      },
    })
  : new Sequelize({ // Fallback para variáveis individuais (menos recomendado no Railway)
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false // Ajuste SSL para produção
      },
      define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true,
        freezeTableName: false,
      },
    });

module.exports = { sequelize, Sequelize };