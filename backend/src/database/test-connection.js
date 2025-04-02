// Script para testar a conexão com o banco de dados
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuração do Sequelize para conexão com o PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: console.log,
});

// Testar conexão
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar se o banco existe
    const [results] = await sequelize.query("SELECT datname FROM pg_database WHERE datname = 'bicho_solto_db';");
    console.log('Resultado da verificação do banco:', results);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    console.error('Detalhes do erro:', error.original);
    process.exit(1);
  }
}

testConnection();