// Script para diagnóstico detalhado da conexão com o banco de dados
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Função para registrar logs em arquivo
function logToFile(message) {
  const logDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'db-diagnostics.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  console.log(message);
}

// Configuração do Sequelize com opções de conexão mais robustas
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: msg => logToFile(msg),
  pool: {
    max: 5, // Máximo de conexões no pool
    min: 0, // Mínimo de conexões no pool
    acquire: 30000, // Tempo máximo para adquirir uma conexão (ms)
    idle: 10000 // Tempo máximo que uma conexão pode ficar ociosa (ms)
  },
  retry: {
    max: 3, // Número máximo de tentativas de reconexão
    timeout: 10000 // Tempo entre tentativas (ms)
  }
});

// Função para verificar se o banco de dados existe
async function checkDatabaseExists() {
  try {
    // Primeiro conectamos ao banco postgres para verificar se nosso banco existe
    const tempConnection = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: 'postgres', // Conecta ao banco padrão postgres
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false
    });
    
    await tempConnection.authenticate();
    logToFile('Conexão temporária estabelecida com o banco postgres');
    
    const [results] = await tempConnection.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
    );
    
    if (results.length === 0) {
      logToFile(`Banco de dados '${process.env.DB_NAME}' não existe. Criando...`);
      await tempConnection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      logToFile(`Banco de dados '${process.env.DB_NAME}' criado com sucesso!`);
    } else {
      logToFile(`Banco de dados '${process.env.DB_NAME}' já existe.`);
    }
    
    await tempConnection.close();
    return true;
  } catch (error) {
    logToFile(`Erro ao verificar/criar banco de dados: ${error.message}`);
    if (error.original) {
      logToFile(`Detalhes do erro: ${JSON.stringify(error.original)}`);
    }
    return false;
  }
}

// Função para testar a conexão principal
async function testMainConnection() {
  try {
    await sequelize.authenticate();
    logToFile('Conexão principal com o banco de dados estabelecida com sucesso!');
    
    // Verificar tabelas existentes
    const [results] = await sequelize.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
    );
    
    if (results.length > 0) {
      const tableNames = results.map(t => t.tablename).join(', ');
      logToFile(`Tabelas encontradas no banco: ${tableNames}`);
    } else {
      logToFile('Nenhuma tabela encontrada no banco de dados. A sincronização não foi executada ainda.');
    }
    return true;
  } catch (error) {
    logToFile(`Erro na conexão principal: ${error.message}`);
    if (error.original) {
      logToFile(`Detalhes do erro: ${JSON.stringify(error.original)}`);
    }
    return false;
  }
}

// Função para verificar configurações do PostgreSQL
async function checkPostgresConfig() {
  try {
    logToFile('Verificando configurações do PostgreSQL...');
    logToFile(`Host: ${process.env.DB_HOST}`);
    logToFile(`Porta: ${process.env.DB_PORT}`);
    logToFile(`Banco: ${process.env.DB_NAME}`);
    logToFile(`Usuário: ${process.env.DB_USER}`);
    // Não logamos a senha por segurança
    
    // Verificar se o serviço do PostgreSQL está rodando
    const isConnected = await sequelize.query('SELECT 1+1 AS result')
      .then(() => true)
      .catch(() => false);
    
    if (isConnected) {
      logToFile('Serviço PostgreSQL está rodando e aceitando conexões.');
    } else {
      logToFile('Não foi possível conectar ao serviço PostgreSQL. Verifique se o serviço está rodando.');
    }
    
    return isConnected;
  } catch (error) {
    logToFile(`Erro ao verificar configurações: ${error.message}`);
    return false;
  }
}

// Função principal de diagnóstico
async function runDiagnostics() {
  logToFile('=== INICIANDO DIAGNÓSTICO DO BANCO DE DADOS ===');
  
  // Verificar configurações
  const configOk = await checkPostgresConfig();
  if (!configOk) {
    logToFile('Falha na verificação das configurações do PostgreSQL.');
    process.exit(1);
  }
  
  // Verificar existência do banco
  const dbExists = await checkDatabaseExists();
  if (!dbExists) {
    logToFile('Falha na verificação/criação do banco de dados.');
    process.exit(1);
  }
  
  // Testar conexão principal
  const connectionOk = await testMainConnection();
  if (!connectionOk) {
    logToFile('Falha na conexão principal com o banco de dados.');
    process.exit(1);
  }
  
  logToFile('=== DIAGNÓSTICO CONCLUÍDO COM SUCESSO ===');
  logToFile('O banco de dados está configurado corretamente e pronto para uso.');
  
  // Fechar conexão
  await sequelize.close();
  process.exit(0);
}

// Executar diagnóstico
runDiagnostics();